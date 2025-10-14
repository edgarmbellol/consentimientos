from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import json

app = FastAPI(title="Sistema de Consentimientos Informados", version="1.0.0")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend React
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Sistema de autenticación simple
security = HTTPBearer()
VALID_TOKEN = "admin_token_123"

# Almacenamiento en memoria (en producción usar base de datos)
templates_db: Dict[str, Dict[str, Any]] = {}
consent_forms_db: Dict[str, Dict[str, Any]] = {}

# Modelos Pydantic
class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    token: str
    message: str

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
    hospital_info: Dict[str, str]
    document_metadata: Dict[str, str]
    patient_fields: List[TemplateField]
    procedure_description: str
    benefits_risks_alternatives: Dict[str, List[str]]
    implications: str
    recommendations: str
    consent_statement: str
    revocation_statement: str
    signature_blocks: List[Dict[str, str]]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class ConsentFormData(BaseModel):
    template_id: str
    patient_data: Dict[str, Any]
    consent_responses: Dict[str, Any]
    signatures: Dict[str, str]
    filled_at: Optional[datetime] = None

class ConsentFormResponse(BaseModel):
    id: str
    template_id: str
    patient_data: Dict[str, Any]
    consent_responses: Dict[str, Any]
    signatures: Dict[str, str]
    filled_at: datetime
    template_title: str

# Función para verificar token
async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if credentials.credentials != VALID_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )
    return credentials.credentials

# Rutas de autenticación
@app.post("/api/auth/login", response_model=LoginResponse)
async def login(login_data: LoginRequest):
    if login_data.username == "admin" and login_data.password == "admin123":
        return LoginResponse(
            token=VALID_TOKEN,
            message="Login exitoso"
        )
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas"
    )

# Rutas para plantillas de consentimiento
@app.get("/api/templates", response_model=List[ConsentTemplate])
async def get_templates(token: str = Depends(verify_token)):
    return list(templates_db.values())

@app.get("/api/templates/{template_id}", response_model=ConsentTemplate)
async def get_template(template_id: str, token: str = Depends(verify_token)):
    if template_id not in templates_db:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    return templates_db[template_id]

@app.post("/api/templates", response_model=ConsentTemplate)
async def create_template(template: ConsentTemplate, token: str = Depends(verify_token)):
    template_id = str(uuid.uuid4())
    template.id = template_id
    template.created_at = datetime.now()
    template.updated_at = datetime.now()
    
    templates_db[template_id] = template.dict()
    return template

@app.put("/api/templates/{template_id}", response_model=ConsentTemplate)
async def update_template(template_id: str, template: ConsentTemplate, token: str = Depends(verify_token)):
    if template_id not in templates_db:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    
    template.id = template_id
    template.updated_at = datetime.now()
    templates_db[template_id] = template.dict()
    return template

@app.delete("/api/templates/{template_id}")
async def delete_template(template_id: str, token: str = Depends(verify_token)):
    if template_id not in templates_db:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    
    del templates_db[template_id]
    return {"message": "Plantilla eliminada exitosamente"}

# Rutas para formularios de consentimiento
@app.get("/api/consent-forms", response_model=List[ConsentFormResponse])
async def get_consent_forms(token: str = Depends(verify_token)):
    forms = []
    for form_id, form_data in consent_forms_db.items():
        template = templates_db.get(form_data["template_id"], {})
        forms.append(ConsentFormResponse(
            id=form_id,
            template_id=form_data["template_id"],
            patient_data=form_data["patient_data"],
            consent_responses=form_data["consent_responses"],
            signatures=form_data["signatures"],
            filled_at=form_data["filled_at"],
            template_title=template.get("title", "Plantilla no encontrada")
        ))
    return forms

@app.post("/api/consent-forms", response_model=ConsentFormResponse)
async def create_consent_form(form_data: ConsentFormData, token: str = Depends(verify_token)):
    if form_data.template_id not in templates_db:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    
    form_id = str(uuid.uuid4())
    filled_at = datetime.now()
    
    consent_form = {
        "id": form_id,
        "template_id": form_data.template_id,
        "patient_data": form_data.patient_data,
        "consent_responses": form_data.consent_responses,
        "signatures": form_data.signatures,
        "filled_at": filled_at
    }
    
    consent_forms_db[form_id] = consent_form
    
    template = templates_db[form_data.template_id]
    return ConsentFormResponse(
        id=form_id,
        template_id=form_data.template_id,
        patient_data=form_data.patient_data,
        consent_responses=form_data.consent_responses,
        signatures=form_data.signatures,
        filled_at=filled_at,
        template_title=template["title"]
    )

@app.get("/api/consent-forms/{form_id}", response_model=ConsentFormResponse)
async def get_consent_form(form_id: str, token: str = Depends(verify_token)):
    if form_id not in consent_forms_db:
        raise HTTPException(status_code=404, detail="Formulario no encontrado")
    
    form_data = consent_forms_db[form_id]
    template = templates_db.get(form_data["template_id"], {})
    
    return ConsentFormResponse(
        id=form_id,
        template_id=form_data["template_id"],
        patient_data=form_data["patient_data"],
        consent_responses=form_data["consent_responses"],
        signatures=form_data["signatures"],
        filled_at=form_data["filled_at"],
        template_title=template.get("title", "Plantilla no encontrada")
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


