from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import json
import os
from sqlalchemy.orm import Session

# Importar configuración de base de datos
from database import (
    get_db, 
    ConsentTemplateDB, 
    ConsentFormDB,
    AuditLogDB,
    create_tables,
    verify_user_sqlserver,
    get_user_info_sqlserver,
    log_audit,
    get_patient_info
)

from pdf_generator import generate_consent_form_pdf
from fastapi.responses import StreamingResponse

app = FastAPI(title="Sistema de Consentimientos Informados", version="1.0.0")

# Crear tablas al iniciar
create_tables()

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],  # Frontend React
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Sistema de autenticación
security = HTTPBearer()
VALID_TOKEN = "admin_token_123"

# Almacenamiento de tokens en memoria (para desarrollo)
# En producción, usar JWT o Redis
active_tokens = {}  # {token: {"username": str, "name": str}}

# Funciones auxiliares para manejar JSON
def json_to_text(data):
    """Convierte datos a JSON string"""
    if data is None:
        return None
    # Si es una lista de objetos Pydantic, convertir a dict
    if isinstance(data, list):
        return json.dumps([item.dict() if hasattr(item, 'dict') else item for item in data])
    # Si es un objeto Pydantic, convertir a dict
    if hasattr(data, 'dict'):
        return json.dumps(data.dict())
    return json.dumps(data)

def text_to_json(text):
    """Convierte JSON string a datos"""
    if text is None or text == "":
        return None
    try:
        return json.loads(text)
    except:
        return None

# Modelos Pydantic
class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    token: str
    message: str
    user: Dict[str, Any]

class TemplateField(BaseModel):
    id: str
    type: str  # "text", "textarea", "checkbox", "radio", "date", "signature"
    label: str
    placeholder: Optional[str] = None
    required: bool = True
    options: Optional[List[str]] = None  # Para radio buttons
    order: int

class ConsentTemplate(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    hospital_info: Dict[str, Any]
    document_metadata: Dict[str, Any]
    patient_fields: List[TemplateField]
    procedure_description: Optional[str] = ""
    benefits_risks_alternatives: Optional[Dict[str, Any]] = None
    implications: Optional[str] = ""
    recommendations: Optional[str] = ""
    consent_statement: Optional[str] = ""
    revocation_statement: Optional[str] = ""
    signature_blocks: List[Dict[str, Any]]

class ConsentTemplateResponse(BaseModel):
    id: str
    title: str
    description: str
    hospital_info: Dict[str, Any]
    document_metadata: Dict[str, Any]
    patient_fields: List[TemplateField]
    procedure_description: Optional[str] = ""
    benefits_risks_alternatives: Optional[Dict[str, Any]] = None
    implications: Optional[str] = ""
    recommendations: Optional[str] = ""
    consent_statement: Optional[str] = ""
    revocation_statement: Optional[str] = ""
    signature_blocks: List[Dict[str, Any]]
    version_number: int = 1
    is_current: bool = True
    parent_template_id: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class ConsentFormData(BaseModel):
    patient_data: Dict[str, Any]
    patient_photo: Optional[str] = None
    consent_responses: Dict[str, Any]
    signatures: Dict[str, str]

class ConsentFormCreate(BaseModel):
    template_id: str
    patient_data: Dict[str, Any]
    patient_photo: Optional[str] = None
    consent_responses: Dict[str, Any]
    signatures: Dict[str, str]

class ConsentFormResponse(BaseModel):
    id: str
    template_id: str
    template_title: str
    patient_data: Dict[str, Any]
    patient_photo: Optional[str] = None
    consent_responses: Dict[str, Any]
    signatures: Dict[str, str]
    filled_at: datetime

# Función auxiliar para convertir plantillas
def template_db_to_response(db_template: ConsentTemplateDB) -> ConsentTemplateResponse:
    """Convierte un ConsentTemplateDB a ConsentTemplateResponse"""
    return ConsentTemplateResponse(
        id=db_template.id,
        title=db_template.title,
        description=db_template.description,
        hospital_info=text_to_json(db_template.hospital_info),
        document_metadata=text_to_json(db_template.document_metadata),
        patient_fields=text_to_json(db_template.patient_fields),
        procedure_description=db_template.procedure_description or "",
        benefits_risks_alternatives=text_to_json(db_template.benefits_risks_alternatives),
        implications=db_template.implications or "",
        recommendations=db_template.recommendations or "",
        consent_statement=db_template.consent_statement or "",
        revocation_statement=db_template.revocation_statement or "",
        signature_blocks=text_to_json(db_template.signature_blocks),
        version_number=db_template.version_number if hasattr(db_template, 'version_number') and db_template.version_number else 1,
        is_current=db_template.is_current if hasattr(db_template, 'is_current') and db_template.is_current is not None else True,
        parent_template_id=db_template.parent_template_id if hasattr(db_template, 'parent_template_id') else None,
        created_by=db_template.created_by if hasattr(db_template, 'created_by') else None,
        created_at=db_template.created_at,
        updated_at=db_template.updated_at
    )

# Función de autenticación
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    
    # Verificar si el token existe en active_tokens
    if token in active_tokens:
        return active_tokens[token]
    
    # Fallback para token estático (compatibilidad)
    if token == VALID_TOKEN:
        return {"username": "admin", "name": "Administrador", "role": "admin"}
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido",
        headers={"WWW-Authenticate": "Bearer"},
    )

# Función para verificar si el usuario es administrador
def is_admin(user: dict) -> bool:
    """Verifica si el usuario es administrador (admin o embl)"""
    username = user.get("username", "").upper()
    return username in ["ADMIN", "EMBL"]

# Función para requerir permisos de administrador
async def require_admin(current_user: dict = Depends(get_current_user)):
    """Dependencia que requiere que el usuario sea administrador"""
    if not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para realizar esta acción. Solo administradores (admin o embl) pueden realizar esta operación."
        )
    return current_user

# Endpoints de autenticación
@app.post("/api/auth/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    http_request: Request,
    db: Session = Depends(get_db)
):
    """Autenticación usando SQL Server"""
    # Verificar usuario en SQL Server
    user_info = verify_user_sqlserver(request.username, request.password)
    
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas"
        )
    
    # Registrar login en auditoría
    client_host = http_request.client.host if http_request.client else "unknown"
    user_agent = http_request.headers.get("user-agent", "unknown")
    
    log_audit(
        db=db,
        username=user_info["username"],
        user_name=user_info.get("name"),
        action="login",
        details={
            "success": True,
            "aplicacion": user_info.get("aplicacion")
        },
        ip_address=client_host,
        user_agent=user_agent
    )

    # Generar token único para este usuario
    token = f"token_{uuid.uuid4().hex}"
    
    # Almacenar token con información del usuario
    active_tokens[token] = {
        "username": user_info["username"],
        "name": user_info.get("name", user_info["username"]),
        "aplicacion": user_info.get("aplicacion"),
        "role": user_info.get("role", "user")
    }
    
    return LoginResponse(
        token=token,
        message="Login exitoso",
        user=user_info
    )

@app.post("/api/auth/logout")
async def logout():
    return {"message": "Logout exitoso"}

# Modelo para respuesta de paciente
class PatientInfoResponse(BaseModel):
    documento: str
    nombre: str
    sexo: str
    fecha_nacimiento: Optional[str]
    edad: Optional[int]
    telefono: str

# Endpoint para buscar paciente
@app.get("/api/patients/{documento}", response_model=PatientInfoResponse)
async def get_patient(
    documento: str,
    current_user: dict = Depends(get_current_user)
):
    """Buscar información del paciente en SQL Server por documento"""
    patient_info = get_patient_info(documento)
    
    if not patient_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Paciente con documento '{documento}' no encontrado"
        )
    
    return PatientInfoResponse(**patient_info)

# Endpoints de plantillas
@app.post("/api/templates", response_model=ConsentTemplateResponse)
async def create_template(
    template: ConsentTemplate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Crear nueva plantilla (solo administradores)"""
    try:
        print(f"DEBUG: Datos recibidos: {template}")
        template_id = str(uuid.uuid4())
    except Exception as e:
        print(f"ERROR en validación: {e}")
        raise HTTPException(status_code=422, detail=f"Error de validación: {str(e)}")
    
    # Crear plantilla en SQLite
    db_template = ConsentTemplateDB(
        id=template_id,
        title=template.title,
        description=template.description,
        hospital_info=json_to_text(template.hospital_info),
        document_metadata=json_to_text(template.document_metadata),
        patient_fields=json_to_text(template.patient_fields),
        procedure_description=template.procedure_description or "",
        benefits_risks_alternatives=json_to_text(template.benefits_risks_alternatives),
        implications=template.implications or "",
        recommendations=template.recommendations or "",
        consent_statement=template.consent_statement or "",
        revocation_statement=template.revocation_statement or "",
        signature_blocks=json_to_text(template.signature_blocks),
        version_number=1,
        is_current=True,
        parent_template_id=None,
        created_by=current_user["username"]
    )
    
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    
    # Registrar en auditoría
    log_audit(
        db=db,
        username=current_user["username"],
        action="create_template",
        resource_type="template",
        resource_id=template_id,
        details={
            "title": template.title,
            "description": template.description
        }
    )
    
    return template_db_to_response(db_template)

@app.get("/api/templates", response_model=List[ConsentTemplateResponse])
async def get_templates(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    include_all_versions: bool = False
):
    """Obtener todas las plantillas (solo versiones actuales por defecto)"""
    query = db.query(ConsentTemplateDB)
    
    # Por defecto, solo mostrar versiones actuales
    if not include_all_versions:
        query = query.filter(ConsentTemplateDB.is_current == True)
    
    templates = query.all()
    return [template_db_to_response(template) for template in templates]

@app.get("/api/templates/{template_id}", response_model=ConsentTemplateResponse)
async def get_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Obtener plantilla por ID"""
    template = db.query(ConsentTemplateDB).filter(ConsentTemplateDB.id == template_id).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    
    return template_db_to_response(template)

@app.put("/api/templates/{template_id}", response_model=ConsentTemplateResponse)
async def update_template(
    template_id: str,
    template: ConsentTemplate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Actualizar plantilla (solo administradores) - Crea una nueva versión"""
    db_template = db.query(ConsentTemplateDB).filter(ConsentTemplateDB.id == template_id).first()
    
    if not db_template:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    
    # Marcar la versión actual como no actual
    db_template.is_current = False
    db.commit()
    
    # Determinar el parent_template_id
    parent_id = db_template.parent_template_id if db_template.parent_template_id else db_template.id
    
    # Calcular el nuevo número de versión
    max_version = db.query(ConsentTemplateDB).filter(
        (ConsentTemplateDB.parent_template_id == parent_id) | (ConsentTemplateDB.id == parent_id)
    ).count()
    
    # Crear nueva versión
    new_template_id = str(uuid.uuid4())
    new_template = ConsentTemplateDB(
        id=new_template_id,
        title=template.title,
        description=template.description,
        hospital_info=json_to_text(template.hospital_info),
        document_metadata=json_to_text(template.document_metadata),
        patient_fields=json_to_text(template.patient_fields),
        procedure_description=template.procedure_description or "",
        benefits_risks_alternatives=json_to_text(template.benefits_risks_alternatives),
        implications=template.implications or "",
        recommendations=template.recommendations or "",
        consent_statement=template.consent_statement or "",
        revocation_statement=template.revocation_statement or "",
        signature_blocks=json_to_text(template.signature_blocks),
        version_number=max_version + 1,
        is_current=True,
        parent_template_id=parent_id,
        created_by=current_user["username"]
    )
    
    db.add(new_template)
    db.commit()
    db.refresh(new_template)
    
    # Registrar en auditoría
    log_audit(
        db=db,
        username=current_user["username"],
        action="update_template",
        resource_type="template",
        resource_id=new_template_id,
        details={
            "title": template.title,
            "previous_version": db_template.version_number,
            "new_version": new_template.version_number,
            "parent_template_id": parent_id
        }
    )
    
    return template_db_to_response(new_template)

@app.delete("/api/templates/{template_id}")
async def delete_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Eliminar plantilla (solo administradores)"""
    template = db.query(ConsentTemplateDB).filter(ConsentTemplateDB.id == template_id).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    
    db.delete(template)
    db.commit()
    
    # Registrar en auditoría
    log_audit(
        db=db,
        username=current_user["username"],
        action="delete_template",
        resource_type="template",
        resource_id=template_id,
        details={
            "title": template.title
        }
    )
    
    return {"message": "Plantilla eliminada exitosamente"}

# Endpoints de versionamiento
@app.get("/api/templates/{template_id}/versions", response_model=List[ConsentTemplateResponse])
async def get_template_versions(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Obtener todas las versiones de una plantilla"""
    # Primero obtener la plantilla para saber el parent_id
    template = db.query(ConsentTemplateDB).filter(ConsentTemplateDB.id == template_id).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    
    # Determinar el parent_id
    parent_id = template.parent_template_id if template.parent_template_id else template.id
    
    # Obtener todas las versiones (incluyendo la original)
    versions = db.query(ConsentTemplateDB).filter(
        (ConsentTemplateDB.id == parent_id) | (ConsentTemplateDB.parent_template_id == parent_id)
    ).order_by(ConsentTemplateDB.version_number.desc()).all()
    
    return [template_db_to_response(v) for v in versions]

@app.post("/api/templates/{template_id}/restore/{version_id}", response_model=ConsentTemplateResponse)
async def restore_template_version(
    template_id: str,
    version_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Restaurar una versión anterior de una plantilla (solo administradores)"""
    # Obtener la versión a restaurar
    version_to_restore = db.query(ConsentTemplateDB).filter(ConsentTemplateDB.id == version_id).first()
    
    if not version_to_restore:
        raise HTTPException(status_code=404, detail="Versión no encontrada")
    
    # Obtener la versión actual
    current_template = db.query(ConsentTemplateDB).filter(ConsentTemplateDB.id == template_id).first()
    
    if not current_template:
        raise HTTPException(status_code=404, detail="Plantilla actual no encontrada")
    
    # Marcar la versión actual como no actual
    current_template.is_current = False
    db.commit()
    
    # Determinar el parent_template_id
    parent_id = current_template.parent_template_id if current_template.parent_template_id else current_template.id
    
    # Calcular el nuevo número de versión
    max_version = db.query(ConsentTemplateDB).filter(
        (ConsentTemplateDB.parent_template_id == parent_id) | (ConsentTemplateDB.id == parent_id)
    ).count()
    
    # Crear nueva versión basada en la versión a restaurar
    new_template_id = str(uuid.uuid4())
    restored_template = ConsentTemplateDB(
        id=new_template_id,
        title=version_to_restore.title,
        description=version_to_restore.description,
        hospital_info=version_to_restore.hospital_info,
        document_metadata=version_to_restore.document_metadata,
        patient_fields=version_to_restore.patient_fields,
        procedure_description=version_to_restore.procedure_description,
        benefits_risks_alternatives=version_to_restore.benefits_risks_alternatives,
        implications=version_to_restore.implications,
        recommendations=version_to_restore.recommendations,
        consent_statement=version_to_restore.consent_statement,
        revocation_statement=version_to_restore.revocation_statement,
        signature_blocks=version_to_restore.signature_blocks,
        version_number=max_version + 1,
        is_current=True,
        parent_template_id=parent_id,
        created_by=current_user["username"]
    )
    
    db.add(restored_template)
    db.commit()
    db.refresh(restored_template)
    
    # Registrar en auditoría
    log_audit(
        db=db,
        username=current_user["username"],
        action="restore_template_version",
        resource_type="template",
        resource_id=new_template_id,
        details={
            "title": version_to_restore.title,
            "restored_from_version": version_to_restore.version_number,
            "new_version": restored_template.version_number
        }
    )
    
    return template_db_to_response(restored_template)

# Endpoints de formularios de consentimiento
@app.post("/api/consent-forms", response_model=ConsentFormResponse)
async def create_consent_form(
    form_data: ConsentFormCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Crear nuevo formulario de consentimiento"""
    form_id = str(uuid.uuid4())
    
    # Obtener título de la plantilla para cache
    template = db.query(ConsentTemplateDB).filter(ConsentTemplateDB.id == form_data.template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    
    # Crear formulario en SQLite
    db_form = ConsentFormDB(
        id=form_id,
        template_id=form_data.template_id,
        template_title=template.title,
        patient_data=json_to_text(form_data.patient_data),
        patient_photo=form_data.patient_photo,
        consent_responses=json_to_text(form_data.consent_responses),
        signatures=json_to_text(form_data.signatures)
    )
    
    db.add(db_form)
    db.commit()
    db.refresh(db_form)
    
    # Registrar en auditoría
    patient_data = text_to_json(db_form.patient_data) or {}
    log_audit(
        db=db,
        username=current_user["username"],
        action="create_form",
        resource_type="consent_form",
        resource_id=form_id,
        details={
            "template_id": form_data.template_id,
            "template_title": template.title,
            "patient_name": patient_data.get("nombre", "N/A") if patient_data else "N/A"
        }
    )
    
    return ConsentFormResponse(
        id=db_form.id,
        template_id=db_form.template_id,
        template_title=db_form.template_title,
        patient_data=text_to_json(db_form.patient_data),
        patient_photo=db_form.patient_photo,
        consent_responses=text_to_json(db_form.consent_responses),
        signatures=text_to_json(db_form.signatures),
        filled_at=db_form.filled_at
    )

@app.get("/api/consent-forms", response_model=List[ConsentFormResponse])
async def get_consent_forms(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Obtener todos los formularios de consentimiento"""
    forms = db.query(ConsentFormDB).order_by(ConsentFormDB.filled_at.desc()).all()
    return [
        ConsentFormResponse(
            id=form.id,
            template_id=form.template_id,
            template_title=form.template_title,
            patient_data=text_to_json(form.patient_data),
            patient_photo=form.patient_photo,
            consent_responses=text_to_json(form.consent_responses),
            signatures=text_to_json(form.signatures),
            filled_at=form.filled_at
        )
        for form in forms
    ]

@app.get("/api/consent-forms/{form_id}", response_model=ConsentFormResponse)
async def get_consent_form(
    form_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Obtener formulario de consentimiento por ID"""
    form = db.query(ConsentFormDB).filter(ConsentFormDB.id == form_id).first()
    
    if not form:
        raise HTTPException(status_code=404, detail="Formulario no encontrado")
    
    return ConsentFormResponse(
        id=form.id,
        template_id=form.template_id,
        template_title=form.template_title,
        patient_data=text_to_json(form.patient_data),
        patient_photo=form.patient_photo,
        consent_responses=text_to_json(form.consent_responses),
        signatures=text_to_json(form.signatures),
        filled_at=form.filled_at
    )

@app.delete("/api/consent-forms/{form_id}")
async def delete_consent_form(
    form_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Eliminar formulario de consentimiento"""
    form = db.query(ConsentFormDB).filter(ConsentFormDB.id == form_id).first()
    
    if not form:
        raise HTTPException(status_code=404, detail="Formulario no encontrado")
    
    db.delete(form)
    db.commit()
    
    return {"message": "Formulario eliminado exitosamente"}

@app.get("/api/consent-forms/{form_id}/pdf")
async def download_consent_form_pdf(
    form_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Descargar formulario de consentimiento como PDF"""
    # Obtener el formulario
    form = db.query(ConsentFormDB).filter(ConsentFormDB.id == form_id).first()
    
    if not form:
        raise HTTPException(status_code=404, detail="Formulario no encontrado")
    
    # Obtener la plantilla
    template = db.query(ConsentTemplateDB).filter(ConsentTemplateDB.id == form.template_id).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    
    # Preparar datos para el PDF
    form_data = {
        'patient_data': text_to_json(form.patient_data) or {},
        'patient_photo': form.patient_photo,
        'consent_responses': text_to_json(form.consent_responses) or {},
        'signatures': text_to_json(form.signatures) or {}
    }
    
    template_data = {
        'title': template.title,
        'description': template.description,
        'hospital_info': text_to_json(template.hospital_info) or {},
        'document_metadata': text_to_json(template.document_metadata) or {},
        'patient_fields': text_to_json(template.patient_fields) or [],
        'procedure_description': template.procedure_description or '',
        'benefits_risks_alternatives': text_to_json(template.benefits_risks_alternatives) or {},
        'implications': template.implications or '',
        'recommendations': template.recommendations or '',
        'consent_statement': template.consent_statement or '',
        'revocation_statement': template.revocation_statement or ''
    }
    
    # Generar PDF
    try:
        # Ruta al logo (si existe)
        logo_path = './logo.png' if os.path.exists('./logo.png') else None
        
        pdf_buffer = generate_consent_form_pdf(form_data, template_data, logo_path)
        
        # Registrar en auditoría
        patient_data = form_data['patient_data']
        log_audit(
            db=db,
            username=current_user["username"],
            action="download_pdf",
            resource_type="consent_form",
            resource_id=form_id,
            details={
                "template_title": template.title,
                "patient_name": patient_data.get("2", "N/A")  # Campo 2 es el nombre
            }
        )
        
        # Generar nombre del archivo
        patient_name = patient_data.get("2", "paciente").replace(" ", "_")
        patient_doc = patient_data.get("1", "")
        filename = f"Consentimiento_{patient_name}_{patient_doc}_{form_id[:8]}.pdf"
        
        # Retornar el PDF
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except Exception as e:
        print(f"Error generando PDF: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al generar el PDF: {str(e)}")

# Modelos para auditoría
class AuditLogResponse(BaseModel):
    id: int
    timestamp: datetime
    username: str
    user_name: Optional[str]
    action: str
    resource_type: Optional[str]
    resource_id: Optional[str]
    details: Optional[Dict[str, Any]]
    ip_address: Optional[str]
    user_agent: Optional[str]

# Endpoints de auditoría
@app.get("/api/audit-logs", response_model=List[AuditLogResponse])
async def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    limit: int = 100,
    offset: int = 0,
    username: Optional[str] = None,
    action: Optional[str] = None
):
    """Obtener logs de auditoría - Requiere autenticación"""
    # Verificar que el usuario tenga permisos (EMBL o admin)
    allowed_users = ["EMBL", "ADMIN", "admin"]
    if current_user["username"].upper() not in [u.upper() for u in allowed_users]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para acceder a esta información"
        )
    
    query = db.query(AuditLogDB).order_by(AuditLogDB.timestamp.desc())
    
    # Filtrar por usuario si se especifica
    if username:
        query = query.filter(AuditLogDB.username == username)
    
    # Filtrar por acción si se especifica
    if action:
        query = query.filter(AuditLogDB.action == action)
    
    # Aplicar paginación
    logs = query.offset(offset).limit(limit).all()
    
    return [
        AuditLogResponse(
            id=log.id,
            timestamp=log.timestamp,
            username=log.username,
            user_name=log.user_name,
            action=log.action,
            resource_type=log.resource_type,
            resource_id=log.resource_id,
            details=json.loads(log.details) if log.details else None,
            ip_address=log.ip_address,
            user_agent=log.user_agent
        )
        for log in logs
    ]

@app.get("/api/audit-logs/summary")
async def get_audit_summary(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Obtener resumen de actividad - Requiere autenticación"""
    # Verificar que el usuario tenga permisos (EMBL o admin)
    allowed_users = ["EMBL", "ADMIN", "admin"]
    if current_user["username"].upper() not in [u.upper() for u in allowed_users]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para acceder a esta información"
        )
    
    from sqlalchemy import func
    
    # Contar acciones por tipo
    actions_count = db.query(
        AuditLogDB.action,
        func.count(AuditLogDB.id).label('count')
    ).group_by(AuditLogDB.action).all()
    
    # Contar usuarios activos
    active_users = db.query(
        func.count(func.distinct(AuditLogDB.username))
    ).filter(
        AuditLogDB.action == 'login'
    ).scalar()
    
    # Últimas acciones
    recent_logs = db.query(AuditLogDB).order_by(
        AuditLogDB.timestamp.desc()
    ).limit(10).all()
    
    return {
        "actions_summary": {action: count for action, count in actions_count},
        "active_users_count": active_users or 0,
        "total_logs": db.query(func.count(AuditLogDB.id)).scalar(),
        "recent_activity": [
            {
                "username": log.username,
                "action": log.action,
                "timestamp": log.timestamp.isoformat(),
                "resource_type": log.resource_type
            }
            for log in recent_logs
        ]
    }

# Endpoint de salud
@app.get("/api/health")
async def health_check():
    """Verificar estado del sistema"""
    # Probar conexión a SQL Server
    user_test = get_user_info_sqlserver("test")
    sqlserver_status = "connected" if user_test is not None else "disconnected"
    
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "database": "sqlite",
        "sqlserver": sqlserver_status
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)