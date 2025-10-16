from sqlalchemy import create_engine, Column, String, Text, Integer, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import pyodbc
from typing import Optional, Dict, Any
import os

# Configuración de SQLite para datos locales
SQLITE_DATABASE_URL = "sqlite:///./consentimientos.db"
engine = create_engine(SQLITE_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Configuración de SQL Server para usuarios
SQL_SERVER = "192.168.1.26"
SQL_DATABASE = "CITISALUD"
SQL_USERNAME = "con"
SQL_PASSWORD = "Sopo2023*"

Base = declarative_base()

# Modelos de base de datos
class ConsentTemplateDB(Base):
    __tablename__ = "consent_templates"
    
    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    hospital_info = Column(Text)  # JSON as text para hospital_info
    document_metadata = Column(Text)  # JSON as text para document_metadata
    patient_fields = Column(Text)  # JSON as text para patient_fields
    procedure_description = Column(Text)  # Descripción del procedimiento
    benefits_risks_alternatives = Column(Text)  # JSON as text para benefits_risks_alternatives
    implications = Column(Text)  # Implicaciones
    recommendations = Column(Text)  # Recomendaciones
    consent_statement = Column(Text)  # Declaración de consentimiento
    revocation_statement = Column(Text)  # Declaración de revocación
    signature_blocks = Column(Text)  # JSON as text para signature_blocks
    
    # Campos de versionamiento
    version_number = Column(Integer, default=1)
    is_current = Column(Boolean, default=True, index=True)
    parent_template_id = Column(String, index=True)  # ID de la plantilla original (base)
    created_by = Column(String)  # Usuario que creó esta versión
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ConsentFormDB(Base):
    __tablename__ = "consent_forms"
    
    id = Column(String, primary_key=True, index=True)
    template_id = Column(String, nullable=False, index=True)
    patient_data = Column(Text)  # JSON as text para patient_data
    patient_photo = Column(Text)  # Base64 encoded photo
    consent_responses = Column(Text)  # JSON as text para consent_responses
    signatures = Column(Text)  # JSON as text para signatures
    filled_at = Column(DateTime, default=datetime.utcnow)
    template_title = Column(String)  # Cache del título para consultas rápidas

class AuditLogDB(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    username = Column(String, nullable=False, index=True)
    user_name = Column(String)  # Nombre completo del usuario
    action = Column(String, nullable=False, index=True)  # login, create_template, create_form, etc.
    resource_type = Column(String)  # template, form, etc.
    resource_id = Column(String)  # ID del recurso afectado
    details = Column(Text)  # JSON con detalles adicionales
    ip_address = Column(String)  # IP del cliente
    user_agent = Column(String)  # User agent del navegador

# Crear tablas
def create_tables():
    Base.metadata.create_all(bind=engine)

# Función para obtener sesión de SQLite
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Función para registrar acciones en el log de auditoría
def log_audit(
    db: sessionmaker,
    username: str,
    action: str,
    user_name: str = None,
    resource_type: str = None,
    resource_id: str = None,
    details: dict = None,
    ip_address: str = None,
    user_agent: str = None
):
    """
    Registra una acción en el log de auditoría
    
    Acciones comunes:
    - login: Usuario inició sesión
    - logout: Usuario cerró sesión
    - create_template: Usuario creó una plantilla
    - update_template: Usuario actualizó una plantilla
    - delete_template: Usuario eliminó una plantilla
    - view_template: Usuario visualizó una plantilla
    - create_form: Usuario llenó un formulario de consentimiento
    - view_form: Usuario visualizó un formulario
    - delete_form: Usuario eliminó un formulario
    """
    try:
        import json
        
        audit_log = AuditLogDB(
            username=username,
            user_name=user_name,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=json.dumps(details) if details else None,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        db.add(audit_log)
        db.commit()
        
        print(f"📝 Audit log: {username} - {action} - {resource_type}:{resource_id if resource_id else 'N/A'}")
        
    except Exception as e:
        print(f"❌ Error registrando audit log: {e}")
        db.rollback()

# Función para conectar a SQL Server
def get_sqlserver_connection():
    """Conecta a SQL Server para consultar usuarios"""
    try:
        # Intentar con Microsoft ODBC Driver primero
        try:
            connection_string = f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={SQL_SERVER};DATABASE={SQL_DATABASE};UID={SQL_USERNAME};PWD={SQL_PASSWORD}"
            print(f"🔍 Intentando conexión con ODBC Driver 17...")
            connection = pyodbc.connect(connection_string, timeout=10)
            print(f"✅ Conexión exitosa con ODBC Driver 17")
            return connection
        except Exception as e1:
            print(f"⚠️ ODBC Driver 17 no disponible: {e1}")
            
            # Fallback a FreeTDS con diferentes configuraciones
            connection_strings = [
                # Configuración 1: FreeTDS básico
                f"DRIVER={{FreeTDS}};SERVER={SQL_SERVER};PORT=1433;DATABASE={SQL_DATABASE};UID={SQL_USERNAME};PWD={SQL_PASSWORD};TDS_Version=8.0",
                # Configuración 2: FreeTDS con TDS 7.0
                f"DRIVER={{FreeTDS}};SERVER={SQL_SERVER};PORT=1433;DATABASE={SQL_DATABASE};UID={SQL_USERNAME};PWD={SQL_PASSWORD};TDS_Version=7.0",
                # Configuración 3: FreeTDS con TDS 7.4
                f"DRIVER={{FreeTDS}};SERVER={SQL_SERVER};PORT=1433;DATABASE={SQL_DATABASE};UID={SQL_USERNAME};PWD={SQL_PASSWORD};TDS_Version=7.4",
            ]
            
            for i, conn_str in enumerate(connection_strings, 1):
                try:
                    print(f"🔍 Intentando conexión FreeTDS (configuración {i})...")
                    connection = pyodbc.connect(conn_str, timeout=10)
                    print(f"✅ Conexión exitosa con FreeTDS (configuración {i})")
                    return connection
                except Exception as e2:
                    print(f"⚠️ Configuración {i} falló: {e2}")
                    continue
            
            raise Exception("No se pudo conectar con ninguna configuración")
            
    except Exception as e:
        print(f"❌ Error conectando a SQL Server: {e}")
        import traceback
        traceback.print_exc()
        return None

# Función para desencriptar clave (restar 2 a cada carácter ASCII)
def decrypt_password(encrypted_password: str) -> str:
    """
    Desencripta la contraseña restando 2 a cada carácter ASCII
    """
    if not encrypted_password:
        return ""
    
    decrypted = ""
    for char in encrypted_password:
        # Restar 2 al valor ASCII del carácter
        decrypted += chr(ord(char) - 2)
    
    return decrypted

# Función para encriptar clave (sumar 2 a cada carácter ASCII)
def encrypt_password(plain_password: str) -> str:
    """
    Encripta la contraseña sumando 2 a cada carácter ASCII
    """
    if not plain_password:
        return ""
    
    encrypted = ""
    for char in plain_password:
        # Sumar 2 al valor ASCII del carácter
        encrypted += chr(ord(char) + 2)
    
    return encrypted

# Función para verificar usuario en SQL Server
def verify_user_sqlserver(username: str, password: str) -> Optional[Dict[str, Any]]:
    """
    Verifica usuario en SQL Server
    Retorna información del usuario si las credenciales son correctas
    """
    connection = get_sqlserver_connection()
    if not connection:
        # TEMPORAL: Usuarios de prueba para desarrollo
        print(f"⚠️ SQL Server no disponible. Usando usuarios de prueba.")
        if username == "admin" and password == "admin123":
            return {
                "username": "admin",
                "name": "Administrador",
                "email": "admin@hospital.com",
                "role": "admin"
            }
        elif username == "medico" and password == "medico123":
            return {
                "username": "medico",
                "name": "Dr. Juan Pérez",
                "email": "medico@hospital.com",
                "role": "medico"
            }
        return None
    
    try:
        cursor = connection.cursor()
        
        # Query para obtener usuario con validaciones de Aplicacion y Estado
        # Estado puede ser '1' o NULL (algunos usuarios tienen NULL)
        query = """
        SELECT CodUsuario, Nombre, Email, Nivel, Estado, documento, Clave, Aplicacion
        FROM Usuarios 
        WHERE CodUsuario = ? 
        AND (Estado = '1' OR Estado IS NULL)
        AND (Aplicacion = '10' OR Aplicacion = '13')
        """
        
        cursor.execute(query, (username,))
        row = cursor.fetchone()
        
        if not row:
            print(f"❌ Usuario '{username}' no encontrado o no cumple validaciones")
            return None
        
        # Extraer datos del usuario
        cod_usuario = row[0]
        nombre = row[1]
        email = row[2]
        nivel = row[3]
        estado = row[4]
        documento = row[5]
        clave_encriptada = row[6]
        aplicacion = row[7]
        
        # Desencriptar la clave almacenada
        clave_desencriptada = decrypt_password(clave_encriptada)
        
        print(f"🔍 Usuario encontrado: {cod_usuario}")
        print(f"   Aplicación: {aplicacion}")
        print(f"   Estado: {estado}")
        print(f"   Clave desencriptada: {'*' * len(clave_desencriptada)}")
        
        # Verificar la contraseña
        if clave_desencriptada == password:
            print(f"✅ Contraseña correcta para usuario '{username}'")
            return {
                "username": cod_usuario,
                "name": nombre or "Usuario",
                "email": email or "",
                "role": nivel or "user",
                "estado": estado,
                "documento": documento,
                "aplicacion": aplicacion
            }
        else:
            print(f"❌ Contraseña incorrecta para usuario '{username}'")
            return None
        
    except Exception as e:
        print(f"❌ Error verificando usuario en SQL Server: {e}")
        import traceback
        traceback.print_exc()
        return None
    finally:
        connection.close()

# Función para obtener información de usuario por username
def get_user_info_sqlserver(username: str) -> Optional[Dict[str, Any]]:
    """
    Obtiene información del usuario por username (sin password)
    """
    connection = get_sqlserver_connection()
    if not connection:
        return None
    
    try:
        cursor = connection.cursor()
        
        # Query para obtener info del usuario con validaciones
        # Estado puede ser '1' o NULL (algunos usuarios tienen NULL)
        query = """
        SELECT CodUsuario, Nombre, Email, Nivel, Estado, documento, Aplicacion
        FROM Usuarios 
        WHERE CodUsuario = ? 
        AND (Estado = '1' OR Estado IS NULL)
        AND (Aplicacion = '10' OR Aplicacion = '13')
        """
        
        cursor.execute(query, (username,))
        row = cursor.fetchone()
        
        if row:
            return {
                "username": row[0],
                "name": row[1] or "Usuario",
                "email": row[2] or "",
                "role": row[3] or "user",
                "estado": row[4],
                "documento": row[5],
                "aplicacion": row[6]
            }
        return None
        
    except Exception as e:
        print(f"Error obteniendo info de usuario en SQL Server: {e}")
        return None
    finally:
        connection.close()

# Función para buscar paciente en SQL Server
def get_patient_info(documento: str) -> Optional[Dict[str, Any]]:
    """
    Busca información del paciente en SQL Server por número de documento
    """
    connection = get_sqlserver_connection()
    if not connection:
        print(f"⚠️ SQL Server no disponible. No se puede buscar paciente.")
        return None
    
    try:
        cursor = connection.cursor()
        
        # Query para buscar paciente en la tabla Pacientes
        query = """
        SELECT 
            Documento,
            Nombre1,
            Nombre2,
            Apellido1,
            Apellido2,
            Sexo,
            FNac,
            Tel
        FROM Pacientes 
        WHERE Documento = ?
        """
        
        cursor.execute(query, (documento,))
        row = cursor.fetchone()
        
        if not row:
            print(f"❌ Paciente con documento '{documento}' no encontrado")
            return None
        
        # Extraer datos
        doc = row[0]
        nombre1 = row[1] or ""
        nombre2 = row[2] or ""
        apellido1 = row[3] or ""
        apellido2 = row[4] or ""
        sexo = row[5] or ""
        fnac = row[6]
        tel = row[7] or ""
        
        # Construir nombre completo
        nombre_completo = f"{nombre1} {nombre2} {apellido1} {apellido2}".strip()
        nombre_completo = " ".join(nombre_completo.split())  # Eliminar espacios extra
        
        # Calcular edad si hay fecha de nacimiento
        edad = None
        fecha_nacimiento_str = None
        if fnac:
            from datetime import datetime
            try:
                # Convertir fecha de nacimiento
                if isinstance(fnac, str):
                    fecha_nac = datetime.strptime(fnac.split()[0], '%Y-%m-%d')
                else:
                    fecha_nac = fnac
                
                fecha_nacimiento_str = fecha_nac.strftime('%Y-%m-%d')
                
                # Calcular edad
                hoy = datetime.now()
                edad = hoy.year - fecha_nac.year - ((hoy.month, hoy.day) < (fecha_nac.month, fecha_nac.day))
            except Exception as e:
                print(f"Error calculando edad: {e}")
        
        print(f"✅ Paciente encontrado: {nombre_completo}")
        
        return {
            "documento": str(doc),
            "nombre": nombre_completo,
            "sexo": sexo,
            "fecha_nacimiento": fecha_nacimiento_str,
            "edad": edad,
            "telefono": tel
        }
        
    except Exception as e:
        print(f"❌ Error buscando paciente en SQL Server: {e}")
        import traceback
        traceback.print_exc()
        return None
    finally:
        connection.close()
