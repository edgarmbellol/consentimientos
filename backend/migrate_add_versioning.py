"""
Script de migración para agregar campos de versionamiento a plantillas existentes
Ejecutar este script después de actualizar el código para migrar datos existentes
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os

# Configuración de SQLite
SQLITE_DATABASE_URL = "sqlite:///./consentimientos.db"
engine = create_engine(SQLITE_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def migrate():
    """Migra las plantillas existentes agregando campos de versionamiento"""
    db = SessionLocal()
    
    try:
        print("🔄 Iniciando migración de versionamiento...")
        
        # Verificar si las columnas ya existen
        result = db.execute(text("PRAGMA table_info(consent_templates)"))
        columns = [row[1] for row in result.fetchall()]
        
        # Agregar columnas si no existen
        if 'version_number' not in columns:
            print("➕ Agregando columna 'version_number'...")
            db.execute(text("ALTER TABLE consent_templates ADD COLUMN version_number INTEGER DEFAULT 1"))
            db.commit()
        
        if 'is_current' not in columns:
            print("➕ Agregando columna 'is_current'...")
            db.execute(text("ALTER TABLE consent_templates ADD COLUMN is_current BOOLEAN DEFAULT 1"))
            db.commit()
        
        if 'parent_template_id' not in columns:
            print("➕ Agregando columna 'parent_template_id'...")
            db.execute(text("ALTER TABLE consent_templates ADD COLUMN parent_template_id TEXT"))
            db.commit()
        
        if 'created_by' not in columns:
            print("➕ Agregando columna 'created_by'...")
            db.execute(text("ALTER TABLE consent_templates ADD COLUMN created_by TEXT"))
            db.commit()
        
        # Actualizar plantillas existentes con valores por defecto
        print("📝 Actualizando plantillas existentes...")
        
        # Establecer version_number = 1 para todas las plantillas sin versión
        db.execute(text("""
            UPDATE consent_templates 
            SET version_number = 1 
            WHERE version_number IS NULL
        """))
        
        # Establecer is_current = True para todas las plantillas
        db.execute(text("""
            UPDATE consent_templates 
            SET is_current = 1 
            WHERE is_current IS NULL
        """))
        
        # Establecer created_by como 'Sistema' para plantillas sin creador
        db.execute(text("""
            UPDATE consent_templates 
            SET created_by = 'Sistema' 
            WHERE created_by IS NULL OR created_by = ''
        """))
        
        db.commit()
        
        # Crear índices para mejorar rendimiento
        print("🔍 Creando índices...")
        try:
            db.execute(text("CREATE INDEX IF NOT EXISTS idx_is_current ON consent_templates(is_current)"))
            db.execute(text("CREATE INDEX IF NOT EXISTS idx_parent_template_id ON consent_templates(parent_template_id)"))
            db.commit()
        except Exception as e:
            print(f"⚠️  Nota: Los índices ya pueden existir - {e}")
        
        # Contar plantillas migradas
        result = db.execute(text("SELECT COUNT(*) FROM consent_templates"))
        count = result.fetchone()[0]
        
        print(f"✅ Migración completada exitosamente!")
        print(f"📊 {count} plantilla(s) actualizada(s)")
        print()
        print("📋 Resumen de cambios:")
        print("   - Agregados campos de versionamiento a la tabla")
        print("   - Todas las plantillas existentes marcadas como versión 1")
        print("   - Todas las plantillas marcadas como versión actual")
        print("   - Creador establecido como 'Sistema' para plantillas existentes")
        print()
        print("🎉 El sistema está listo para usar el versionamiento!")
        
    except Exception as e:
        print(f"❌ Error durante la migración: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 70)
    print("🔧 MIGRACIÓN DE BASE DE DATOS - SISTEMA DE VERSIONAMIENTO")
    print("=" * 70)
    print()
    
    if not os.path.exists("consentimientos.db"):
        print("⚠️  ADVERTENCIA: No se encontró la base de datos 'consentimientos.db'")
        print("   Asegúrate de ejecutar este script desde el directorio 'backend'")
        print()
        response = input("¿Deseas continuar de todos modos? (s/n): ")
        if response.lower() != 's':
            print("❌ Migración cancelada")
            exit(0)
    
    print("ℹ️  Este script agregará campos de versionamiento a las plantillas existentes")
    print("   y actualizará los datos para que sean compatibles con el nuevo sistema.")
    print()
    response = input("¿Deseas continuar con la migración? (s/n): ")
    
    if response.lower() == 's':
        migrate()
    else:
        print("❌ Migración cancelada por el usuario")

