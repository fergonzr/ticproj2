// Navigation
export const index: string = "Inicio";
export const medicalRegister: string = "Registro Médico";
export const aboutUs: string = "Sobre Nosotros";
export const pqrs: string = "PQRS";
export const paramedic: string = "Paramédico";

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
export const labelAuthorize: string =
  "Autoriza el uso de sus datos personales y georreferenciación";
export const labelSelectPerson: string = "Seleccionar persona";
export const labelNewPerson: string = "Nueva persona";
export const labelReportFor: string = "Reportar para";
export const labelThirdParty: string = "Un tercero";

// Buttons
export const loginPrompt: string = "Iniciar Sesión";
export const paramedicLabel: string = "Paramédico";
// MedicalRegister buttons / sections
export const btnRegister: string = "Registrarse";
export const btnMedicalData: string = "Datos para asistencia medica";
export const btnSaveData: string = "Guardar Datos";
export const btnUpdateData: string = "Actualizar Datos";
export const btnSending: string = "Enviando...";
export const btnDeletePerson: string = "Eliminar persona";
export const btnDelete: string = "Eliminar";

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
export const placeholderTreatment: string =
  "Describe el tratamiento aplicado...";
export const btnCancel: string = "Cancelar";
export const btnSend: string = "Enviar";
export const btnOK: string = "Aceptar";

// Dropdown options
export const optionNone: string = "Ninguno";
export const optionYes: string = "Sí";
export const optionNo: string = "No";

// Alerts
export const alertError: string = "Error";
export const alertSuccess: string = "Éxito";
export const alertMissingFields: string =
  "Por favor completa los campos obligatorios.";
export const alertAuthRequired: string =
  "Debes autorizar el uso de tus datos para continuar.";
export const alertSaveSuccess: string = "Datos guardados correctamente.";
export const alertUpdateSuccess: string = "Datos actualizados correctamente.";
export const alertSaveError: string = "No se pudieron guardar los datos.";
export const alertSaveFailed: string = "No se pudieron guardar los datos.";
export const alertDeleteSuccess: string = "Persona eliminada correctamente.";
export const alertDeleteFailed: string = "No se pudo eliminar la persona.";
export const alertConfirmDelete: string = "Confirmar eliminación";
export const alertConfirmDeleteMessage: string =
  "¿Estás seguro de que quieres eliminar esta persona? Esta acción no se puede deshacer.";
export const alertTriageMissingFields: string =
  "Por favor completa todos los campos del triaje.";
export const alertReportSuccess: string = "Reporte enviado correctamente.";
export const alertReportError: string = "No se pudo enviar el reporte.";
export const alertNoEmergencyCase: string =
  "No hay un caso de emergencia asociado.";
export const alertWarning: string = "Advertencia";
export const alertLocationNotAvailable: string =
  "No se pudo determinar la ubicación actual. La emergencia será reportada sin información de ubicación.";

//Validation messages
export const validationNameRequired: string = "El nombre es obligatorio.";
export const validationLastNameRequired: string =
  "Los apellidos son obligatorios.";
export const validationPhoneRequired: string = "El celular es obligatorio.";
export const validationDocumentRequired: string =
  "El número de documento es obligatorio.";
export const validationAgeRequired: string = "La edad es obligatoria.";
export const validationPacemakerRequired: string =
  "Debes indicar si el paciente tiene marcapasos.";
export const validationBleedingRequired: string =
  "Debes seleccionar el nivel de sangrado (no puede ser Ninguno).";
export const validationPatientStatusRequired: string =
  "Debes seleccionar el estado del paciente (no puede ser Ninguno).";
export const validationTreatmentRequired: string =
  "Debes describir el tratamiento aplicado.";

export const validationPhoneDigits: string =
  "El celular debe tener exactamente 10 dígitos";
export const validationDocumentMinLength: string =
  "El número de documento debe tener al menos 5 dígitos";
export const validationDocumentOnlyDigits: string =
  "El número de documento solo debe contener dígitos";
export const validationAgeNegative: string = "La edad no puede ser negativa";
export const validationAgeMax: string = "La edad no puede ser mayor a 100 años";

// EmergencyBrowser (Paramedic)
export const emergencyListTitle: string = "Lista de emergencias";
export const acceptRequest: string = "Aceptar solicitud";
export const reportArrival: string = "Reportar llegada";
export const routeTo: string = "Enrutar";
export const callPatient: string = "Llamar";
export const patientInfo: string = "Información";
export const estimatedTime: string = "Min";
export const noActiveEmergency: string = "Sin emergencias activas";
export const towards: string = "hacia";
export const triage: string = "Triaje";
export const goBack: string = "Volver";
export const labelLocation: string = "Ubicación";
