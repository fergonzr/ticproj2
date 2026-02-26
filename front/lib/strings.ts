// Navigation
export const index: string = "Inicio";
export const medicalRegister: string = "Registro Médico";
export const aboutUs: string = "Sobre Nosotros";
export const pqrs: string = "PQRS";

// labels
export const labelName: string = "Nombre";
export const labelLastName: string = "Apellidos";
export const labelPhone: string = "Celular";
export const labelIDType: string = "Tipo de Documento";
export const labelID: string = "Cédula";
export const labelAge: string = "Edad";
export const labelAllergies: string = "Alergias";
export const labelDiseases: string = "Enfermedades";
export const labelPacemaker: string = "Marca pasos";
export const labelBloodType: string = "Tipo de Sangre";
export const labelAuthorize: string = "Autoriza el uso de sus datos personales y georreferenciación";

// Buttons
export const loginPrompt: string = "Iniciar Sesión";
// MedicalRegister buttons / sections
export const btnRegister: string = "Registrarse";
export const btnMedicalData: string = "Datos para asistencia medica";
export const btnSaveData: string = "Guardar Datos";

// Misc text
export const emergency: string = "Emergencia";
export const emergencyBtnInitial: string =
  "Pulsar 3 segundos para solicitar ayuda";
export const aboutUsTitle: string = "Sobre nosotros";
export const aboutUsDescription: string =
  "Somos una compañía de la alcaldía de Envigado que procura ayudar a la asistencia medica para los ciudadanos";
export const aboutUsContact: string = "Contacto";
export const aboutUsPhoneNumber: string = "(604) 2766666";

// Emergency status messages
export const emergencyStatusMessages: Record<string, string> = {
  RECEIVED: "Emergencia enviada",
  DISPATCHED: "La ayuda viene en camino",
  ON_SITE: "La ayuda ha llegado",
  ON_ROUTE: "Desplazándose a centro médico",
  CLOSED: "Emergencia completada",
  CANCELLED: "Emergencia cancelada",
};

export const tipText: string = "Tips: Si ocurre un inconveniente llamar al 123";

// Triage (Report screen)
export const sectionRecord: string = "Registro";
export const sectionTriage: string = "Triaje";
export const labelBleeding: string = "Sangrado";
export const labelContusion: string = "Contusión";
export const labelFracture: string = "Fractura";
export const labelUnconscious: string = "Inconsciente";
export const labelTreatment: string = "Tratamiento";
export const labelPatientStatus: string = "Estado del paciente";
export const placeholderTreatment: string = "Describe el tratamiento aplicado...";
export const btnCancel: string = "Cancelar";
export const btnSend: string = "Enviar";

// Dropdown options
export const optionNone: string = "Ninguno";
export const optionYes: string = "Sí";
export const optionNo: string = "No";

// Alerts
export const alertError: string = "Error";
export const alertSuccess: string = "Éxito";
export const alertMissingFields: string = "Por favor completa los campos obligatorios.";
export const alertAuthRequired: string =
  "Debes autorizar el uso de tus datos para continuar.";
export const alertSaveSuccess: string = "Datos guardados correctamente.";
export const alertSaveError: string = "No se pudieron guardar los datos.";
export const alertTriageMissingFields: string =
  "Por favor completa todos los campos del triaje.";
export const alertReportSuccess: string = "Reporte enviado correctamente.";
export const alertReportError: string = "No se pudo enviar el reporte.";