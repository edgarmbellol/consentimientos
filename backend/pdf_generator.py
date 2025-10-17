"""
Generador de PDFs para formularios de consentimiento informado
Utiliza ReportLab para crear documentos profesionales
"""
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, 
    PageBreak, Image as RLImage, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from io import BytesIO
from PIL import Image
import base64
from datetime import datetime
import json

class ConsentFormPDFGenerator:
    def __init__(self):
        self.buffer = BytesIO()
        self.doc = SimpleDocTemplate(
            self.buffer,
            pagesize=letter,
            rightMargin=0.75*inch,
            leftMargin=0.75*inch,
            topMargin=0.75*inch,
            bottomMargin=0.75*inch
        )
        self.styles = getSampleStyleSheet()
        self._create_custom_styles()
        
    def _create_custom_styles(self):
        """Crea estilos personalizados para el PDF"""
        # Título principal
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=16,
            textColor=colors.HexColor('#2C5282'),
            spaceAfter=12,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        # Subtítulo
        self.styles.add(ParagraphStyle(
            name='CustomHeading',
            parent=self.styles['Heading2'],
            fontSize=12,
            textColor=colors.HexColor('#2C5282'),
            spaceAfter=8,
            spaceBefore=10,
            fontName='Helvetica-Bold'
        ))
        
        # Texto normal
        self.styles.add(ParagraphStyle(
            name='CustomBody',
            parent=self.styles['Normal'],
            fontSize=10,
            leading=14,
            alignment=TA_JUSTIFY,
            spaceAfter=6
        ))
        
        # Lista numerada
        self.styles.add(ParagraphStyle(
            name='ListItem',
            parent=self.styles['Normal'],
            fontSize=10,
            leading=14,
            leftIndent=20,
            spaceAfter=4
        ))
        
    def _decode_base64_image(self, base64_string):
        """Decodifica una imagen base64 y la convierte en un objeto Image de ReportLab"""
        try:
            # Remover el prefijo data:image si existe
            if ',' in base64_string:
                base64_string = base64_string.split(',')[1]
            
            # Decodificar base64
            image_data = base64.b64decode(base64_string)
            image_buffer = BytesIO(image_data)
            
            # Abrir con PIL para validar y convertir
            pil_image = Image.open(image_buffer)
            
            # Guardar en un nuevo buffer
            img_buffer = BytesIO()
            pil_image.save(img_buffer, format='PNG')
            img_buffer.seek(0)
            
            return RLImage(img_buffer, width=2*inch, height=1.5*inch)
        except Exception as e:
            print(f"Error decodificando imagen: {e}")
            return None
    
    def _create_header(self, template_data, logo_path=None):
        """Crea el encabezado del documento con logo e información del hospital"""
        elements = []
        
        # Crear una tabla de 3 columnas para mejor distribución
        header_data = []
        
        # Columna 1: Logo (si existe)
        logo_cell = ""
        if logo_path:
            try:
                logo = RLImage(logo_path, width=0.8*inch, height=0.8*inch)
                logo_cell = logo
            except:
                logo_cell = ""
        
        # Columna 2: Información del hospital
        hospital_info = f"""
        <b>{template_data['hospital_info']['name']}</b><br/>
        NIT: {template_data['hospital_info']['nit']}<br/>
        {template_data['hospital_info']['address']}<br/>
        Tel: {template_data['hospital_info']['phone']}
        """
        
        # Columna 3: Información del documento
        doc_info = f"""
        <b>Tipo:</b> {template_data['document_metadata']['type']}<br/>
        <b>Código:</b> {template_data['document_metadata']['code']}<br/>
        <b>Versión:</b> {template_data['document_metadata']['version']}<br/>
        <b>Fecha:</b> {template_data['document_metadata']['revision_date']}
        """
        
        # Crear la fila del header
        if logo_cell:
            header_data = [[
                logo_cell,
                Paragraph(hospital_info, self.styles['CustomBody']),
                Paragraph(doc_info, self.styles['CustomBody'])
            ]]
        else:
            # Si no hay logo, usar solo 2 columnas
            header_data = [[
                Paragraph(hospital_info, self.styles['CustomBody']),
                Paragraph(doc_info, self.styles['CustomBody'])
            ]]
        
        # Crear tabla con distribución optimizada
        if logo_cell:
            header_table = Table(header_data, colWidths=[1.2*inch, 3.5*inch, 2.3*inch])
            header_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('ALIGN', (0, 0), (0, 0), 'CENTER'),  # Logo centrado
                ('ALIGN', (1, 0), (1, 0), 'LEFT'),    # Hospital info a la izquierda
                ('ALIGN', (2, 0), (2, 0), 'RIGHT'),   # Doc info a la derecha
                ('LEFTPADDING', (0, 0), (-1, -1), 6),
                ('RIGHTPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ]))
        else:
            header_table = Table(header_data, colWidths=[4*inch, 3*inch])
            header_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('ALIGN', (0, 0), (0, 0), 'LEFT'),    # Hospital info a la izquierda
                ('ALIGN', (1, 0), (1, 0), 'RIGHT'),   # Doc info a la derecha
                ('LEFTPADDING', (0, 0), (-1, -1), 6),
                ('RIGHTPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ]))
        
        elements.append(header_table)
        elements.append(Spacer(1, 0.2*inch))
        
        return elements
    
    def _create_patient_section(self, patient_data, patient_fields, patient_photo=None):
        """Crea la sección de datos del paciente"""
        elements = []
        
        elements.append(Paragraph("DATOS DEL PACIENTE", self.styles['CustomHeading']))
        
        # Crear tabla de datos del paciente
        patient_info = []
        for field in sorted(patient_fields, key=lambda x: x['order']):
            value = patient_data.get(field['id'], 'No especificado')
            patient_info.append([
                Paragraph(f"<b>{field['label']}:</b>", self.styles['CustomBody']),
                Paragraph(str(value), self.styles['CustomBody'])
            ])
        
        patient_table = Table(patient_info, colWidths=[2.5*inch, 4*inch])
        patient_table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E0E0E0')),
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F5F5F5')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(patient_table)
        
        # Foto del paciente si existe
        if patient_photo:
            elements.append(Spacer(1, 0.15*inch))
            photo_img = self._decode_base64_image(patient_photo)
            if photo_img:
                elements.append(Paragraph("<b>Fotografía del Paciente:</b>", self.styles['CustomBody']))
                elements.append(Spacer(1, 0.1*inch))
                elements.append(photo_img)
        
        elements.append(Spacer(1, 0.15*inch))
        return elements
    
    def _create_procedure_section(self, template_data):
        """Crea la sección de descripción del procedimiento"""
        elements = []
        
        elements.append(Paragraph("DESCRIPCIÓN DEL PROCEDIMIENTO", self.styles['CustomHeading']))
        elements.append(Paragraph(template_data.get('procedure_description', ''), self.styles['CustomBody']))
        elements.append(Spacer(1, 0.1*inch))
        
        return elements
    
    def _create_benefits_risks_section(self, benefits_risks_alternatives):
        """Crea la sección de beneficios, riesgos y alternativas"""
        elements = []
        
        elements.append(Paragraph("BENEFICIOS, RIESGOS Y ALTERNATIVAS", self.styles['CustomHeading']))
        
        # Crear tabla de 3 columnas
        table_data = [
            [
                Paragraph("<b>Beneficios</b>", self.styles['CustomBody']),
                Paragraph("<b>Riesgos</b>", self.styles['CustomBody']),
                Paragraph("<b>Alternativas</b>", self.styles['CustomBody'])
            ]
        ]
        
        benefits = benefits_risks_alternatives.get('benefits', [])
        risks = benefits_risks_alternatives.get('risks', [])
        alternatives = benefits_risks_alternatives.get('alternatives', [])
        
        max_items = max(len(benefits), len(risks), len(alternatives))
        
        for i in range(max_items):
            benefit = f"• {benefits[i]}" if i < len(benefits) else ""
            risk = f"• {risks[i]}" if i < len(risks) else ""
            alternative = f"• {alternatives[i]}" if i < len(alternatives) else ""
            
            table_data.append([
                Paragraph(benefit, self.styles['CustomBody']),
                Paragraph(risk, self.styles['CustomBody']),
                Paragraph(alternative, self.styles['CustomBody'])
            ])
        
        bra_table = Table(table_data, colWidths=[2.17*inch, 2.17*inch, 2.17*inch])
        bra_table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E0E0E0')),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4A90E2')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(bra_table)
        elements.append(Spacer(1, 0.1*inch))
        
        return elements
    
    def _create_text_section(self, title, content):
        """Crea una sección de texto con título"""
        elements = []
        elements.append(Paragraph(title, self.styles['CustomHeading']))
        
        # Si el contenido tiene saltos de línea, procesarlos
        if '\n' in content:
            for line in content.split('\n'):
                if line.strip():
                    elements.append(Paragraph(line.strip(), self.styles['CustomBody']))
        else:
            elements.append(Paragraph(content, self.styles['CustomBody']))
        
        elements.append(Spacer(1, 0.15*inch))
        return elements
    
    def _create_consent_declaration(self, consent_statement):
        """Crea la declaración de consentimiento con formato de lista numerada"""
        elements = []
        
        elements.append(Paragraph("DECLARACIÓN DE CONSENTIMIENTO INFORMADO", self.styles['CustomHeading']))
        
        # Procesar el texto línea por línea
        lines = consent_statement.split('\n')
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Si la línea empieza con número, formatear como item numerado
            if line and line[0].isdigit() and '. ' in line:
                elements.append(Paragraph(line, self.styles['ListItem']))
            elif 'DECLARO QUE' in line.upper():
                elements.append(Paragraph(f"<b>{line}</b>", self.styles['CustomBody']))
            else:
                elements.append(Paragraph(line, self.styles['CustomBody']))
        
        elements.append(Spacer(1, 0.1*inch))
        return elements
    
    def _create_consent_response(self, consent_response):
        """Crea la sección de respuesta al consentimiento"""
        elements = []
        
        accepted = consent_response == 'si'
        
        response_text = f"""
        <b>RESPUESTA DEL PACIENTE:</b> {'✓ SÍ, ACEPTO' if accepted else '✗ NO ACEPTO'}
        """
        
        style = ParagraphStyle(
            name='ConsentResponse',
            parent=self.styles['CustomBody'],
            fontSize=11,
            textColor=colors.HexColor('#38A169' if accepted else '#E53E3E'),
            fontName='Helvetica-Bold',
            spaceAfter=10,
            spaceBefore=10,
            borderPadding=10,
            borderColor=colors.HexColor('#38A169' if accepted else '#E53E3E'),
            borderWidth=1
        )
        
        elements.append(Paragraph(response_text, style))
        elements.append(Spacer(1, 0.1*inch))
        
        return elements
    
    def _create_signatures_section(self, signatures, consent_response):
        """Crea la sección de firmas"""
        elements = []
        
        title = "FIRMAS - RECHAZO DEL CONSENTIMIENTO" if consent_response == 'no' else "FIRMAS DEL CONSENTIMIENTO INFORMADO"
        elements.append(Paragraph(title, self.styles['CustomHeading']))
        
        # Determinar qué firmas mostrar
        if consent_response == 'no':
            # Firmas de rechazo
            signature_blocks = [
                {'role': 'responsable', 'label': 'PERSONA RESPONSABLE O USUARIO'},
                {'role': 'acompanante', 'label': 'ACOMPAÑANTE (Opcional)'}
            ]
        else:
            # Firmas normales
            signature_blocks = [
                {'role': 'usuario', 'label': 'USUARIO O PERSONA RESPONSABLE'},
                {'role': 'profesional', 'label': 'PROFESIONAL QUE REALIZA EL PROCEDIMIENTO'},
                {'role': 'acompanante', 'label': 'ACOMPAÑANTE (Opcional)'}
            ]
        
        for i, block in enumerate(signature_blocks):
            role = block['role']
            name = signatures.get(f"{role}_name")
            document = signatures.get(f"{role}_document")
            signature = signatures.get(f"{role}_signature")
            
            # Solo mostrar si hay al menos un dato
            if name or document or signature:
                # Espaciado más compacto entre secciones
                if i > 0:
                    elements.append(Spacer(1, 0.15*inch))
                else:
                    elements.append(Spacer(1, 0.1*inch))
                
                elements.append(Paragraph(f"<b>{block['label']}</b>", self.styles['CustomBody']))
                
                # Crear tabla más compacta con firma integrada
                table_data = []
                
                # Fila de datos
                table_data.append([
                    Paragraph(f"<b>Nombre:</b> {name or 'No especificado'}", self.styles['CustomBody']),
                    Paragraph(f"<b>Documento:</b> {document or 'No especificado'}", self.styles['CustomBody'])
                ])
                
                # Fila de firma
                if signature:
                    sig_img = self._decode_base64_image(signature)
                    if sig_img:
                        # La imagen ya está redimensionada en _decode_base64_image
                        table_data.append([
                            Paragraph("<b>Firma Digital:</b>", self.styles['CustomBody']),
                            sig_img
                        ])
                    else:
                        table_data.append([
                            Paragraph("<b>Firma Digital:</b>", self.styles['CustomBody']),
                            Paragraph("Firma no disponible", self.styles['CustomBody'])
                        ])
                else:
                    table_data.append([
                        Paragraph("<b>Firma Digital:</b>", self.styles['CustomBody']),
                        Paragraph("Sin firma", self.styles['CustomBody'])
                    ])
                
                # Crear tabla con firma integrada
                sig_table = Table(table_data, colWidths=[2.5*inch, 4*inch])
                sig_table.setStyle(TableStyle([
                    ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('LEFTPADDING', (0, 0), (-1, -1), 6),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
                    ('TOPPADDING', (0, 0), (-1, -1), 4),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E0E0E0')),
                    ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F8F9FA')),
                ]))
                elements.append(sig_table)
        
        return elements
    
    def generate_pdf(self, form_data, template_data, logo_path=None):
        """
        Genera el PDF del formulario de consentimiento
        
        Args:
            form_data: Datos del formulario completado
            template_data: Datos de la plantilla
            logo_path: Ruta al logo del hospital (opcional)
        
        Returns:
            BytesIO con el contenido del PDF
        """
        elements = []
        
        # Header
        elements.extend(self._create_header(template_data, logo_path))
        
        # Título del consentimiento
        elements.append(Paragraph(template_data['title'], self.styles['CustomTitle']))
        elements.append(Spacer(1, 0.15*inch))
        
        # Datos del paciente
        elements.extend(self._create_patient_section(
            form_data['patient_data'],
            template_data['patient_fields'],
            form_data.get('patient_photo')
        ))
        
        # Descripción del procedimiento
        if template_data.get('procedure_description'):
            elements.extend(self._create_procedure_section(template_data))
        
        # Beneficios, riesgos y alternativas
        if template_data.get('benefits_risks_alternatives'):
            elements.extend(self._create_benefits_risks_section(
                template_data['benefits_risks_alternatives']
            ))
        
        # Implicaciones
        if template_data.get('implications'):
            elements.extend(self._create_text_section(
                "IMPLICACIONES",
                template_data['implications']
            ))
        
        # Recomendaciones
        if template_data.get('recommendations'):
            elements.extend(self._create_text_section(
                "RECOMENDACIONES",
                template_data['recommendations']
            ))
        
        # Declaración de consentimiento
        if template_data.get('consent_statement'):
            elements.extend(self._create_consent_declaration(
                template_data['consent_statement']
            ))
        
        # Respuesta del consentimiento
        consent_response = form_data['consent_responses'].get('consent')
        if consent_response:
            elements.extend(self._create_consent_response(consent_response))
        
        # Autorización digital
        digital_auth = form_data['consent_responses'].get('digital_authorization')
        if digital_auth:
            auth_text = f"<b>Autorización de Tratamiento de Datos:</b> {'✓ SÍ AUTORIZO' if digital_auth == 'si' else '✗ NO AUTORIZO'}"
            elements.append(Paragraph(auth_text, self.styles['CustomBody']))
            elements.append(Spacer(1, 0.1*inch))
        
        # Revocatoria (solo si se rechazó el consentimiento)
        if consent_response == 'no' and template_data.get('revocation_statement'):
            elements.extend(self._create_text_section(
                "REVOCATORIA DEL CONSENTIMIENTO",
                template_data['revocation_statement']
            ))
        
        # Firmas
        if form_data.get('signatures'):
            elements.extend(self._create_signatures_section(
                form_data['signatures'],
                consent_response
            ))
        
        # Footer
        elements.append(Spacer(1, 0.15*inch))
        footer_text = f"""
        <para alignment="center">
        <font size="8" color="#666666">
        {template_data['hospital_info']['address']} | 
        Tel: {template_data['hospital_info']['phone']} | 
        Email: {template_data['hospital_info']['email']}<br/>
        {template_data['hospital_info']['website']}<br/>
        <br/>
        Este documento cumple con la Ley 1581 de 2012, Decreto 1377, Decreto 1074 de 2015 
        y demás normativas vigentes sobre protección de datos personales.<br/>
        Generado el {datetime.now().strftime('%d/%m/%Y a las %H:%M')}
        </font>
        </para>
        """
        elements.append(Paragraph(footer_text, self.styles['Normal']))
        
        # Construir el PDF
        self.doc.build(elements)
        self.buffer.seek(0)
        return self.buffer


def generate_consent_form_pdf(form_data, template_data, logo_path=None):
    """
    Función auxiliar para generar el PDF
    
    Args:
        form_data: Datos del formulario completado (dict)
        template_data: Datos de la plantilla (dict)
        logo_path: Ruta al logo del hospital (opcional)
    
    Returns:
        BytesIO con el contenido del PDF
    """
    generator = ConsentFormPDFGenerator()
    return generator.generate_pdf(form_data, template_data, logo_path)

