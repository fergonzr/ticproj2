import { PQRSSubmissionType } from "./models";

// Navigation
export const index: string = "Inicio";
export const medicalRegister: string = "Registro Médico";
export const medicalRegisterList: string = "Registros Médicos";
export const aboutUs: string = "Sobre Nosotros";
export const pqrs: string = "PQRS";
export const paramedic: string = "Paramédico";
export const operator: string = "Operador";

// Login form
export const labelEmail: string = "Correo";
export const labelPassword: string = "Contraseña";
export const placeholderPassword: string = "••••••••••••••••••••••••";
export const placeholderOperatorEmail: string = "operador@envigado.gov.co";
export const placeholderParamedicEmail: string = "javier.pelaez@envigado.gov.co";

// Paramedic access
export const paramedicMenuSectionTitle: string = "Acceso paramédico";
export const paramedicMenuSectionSubtitle: string =
  "Solo para personal autorizado";
export const paramedicLoginNotice: string =
  "Esta funcionalidad está diseñada exclusivamente para personal paramédico autorizado.";

// Operator access
export const operatorMenuSectionTitle: string = "Acceso operador";
export const operatorMenuSectionSubtitle: string = "Solo para personal autorizado";
export const operatorLoginNotice: string =
  "Esta funcionalidad está diseñada exclusivamente para operadores autorizados del sistema.";
export const operatorLabel: string = "Operador";

// Operator dashboard
export const operatorDashboardTitle: string = "Panel de Emergencias";
export const operatorNoEmergencies: string = "Sin emergencias pendientes";
export const operatorStateReceived: string = "Recibida";
export const operatorStateTriaged: string = "Clasificada";
export const operatorStateAssigned: string = "Asignada";
export const operatorStateOnsite: string = "En sitio";
export const operatorStateUnknown: string = "Desconocido";
export const btnTriage: string = "Triaje";
export const btnAssign: string = "Asignar";
export const operatorTriageTitle: string = "Clasificar emergencia";
export const triageBleeding: string = "Sangrado";
export const triageDizziness: string = "Mareo";
export const triageBlurredVision: string = "Visión borrosa";
export const triageUnconscious: string = "Inconsciente";
export const triageDifficultyBreathing: string = "Dificultad para respirar";
export const triageFracture: string = "Fractura";
export const triageChestPain: string = "Dolor en el pecho";
export const triageNumbnessLimbs: string = "Entumecimiento de extremidades";
export const operatorAssignTitle: string = "Asignar paramédico";
export const operatorParamedicIdLabel: string = "ID del paramédico";
export const operatorParamedicIdPlaceholder: string = "Ingresa el ID del paramédico";
export const alertOperatorAssignIdRequired: string =
  "Por favor ingresa el ID del paramédico.";
export const alertOperatorConnecting: string = "Conectando al servidor...";
export const operatorMedicalInfo: string = "Información médica";
export const operatorLocation: string = "Ubicación";

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
export const proptToSettings: string = "Ir a ajustes";
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
export const btnAddRecord: string = "Agregar registro";
export const btnEdit: string = "Editar";
export const medicalRegisterListEmpty: string = "No hay registros médicos guardados.";
export const btnCancel: string = "Cancelar";
export const btnSend: string = "Enviar";
export const btnOK: string = "Aceptar";
export const cancelEmergencyBtn: string = "Cancelar emergencia";
export const cancelEmergencyConfirmTitle: string = "¿Cancelar emergencia?";
export const cancelEmergencyConfirmBody: string = "Se notificará al equipo paramédico que ya no necesitas ayuda.";
export const cancelAssignmentBtn: string = "Abandonar caso";
export const cancelAssignmentSheetTitle: string = "¿Por qué abandonas?";
export const cancelAssignmentConfirmLabel: string = "Confirmar abandono";
export const emergencyCanceledExternally: string =
  "La emergencia fue cancelada. Volviendo a la pantalla principal.";

// Dropdown options
export const optionNone: string = "Ninguno";
export const optionNoneF: string = "Ninguna";
export const optionYes: string = "Sí";
export const optionNo: string = "No";

// TagComboInput
export const btnTagAdd: string = "Agregar";
export const btnTagRemove: string = "×";
export const placeholderAllergies: string = "Escribe o selecciona una alergia";
export const placeholderDiseases: string = "Escribe o selecciona una enfermedad";

// Misc values
export const valueMissing: string = "—";
export const unitYears: string = "años";
export const alertLabel: string = "Alerta";

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
export const alertMaxPersonsReached: string =
  "Has alcanzado el máximo de personas que puedes registrar.";
export const maxPersonsReachedHint: string =
  "Máximo de personas registradas alcanzado";
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
export const alertInvalidCredentials: string =
  "Correo o contraseña incorrectos.";
export const alertSessionExpired: string =
  "Tu sesión ha expirado. Por favor cierra sesión e inicia sesión nuevamente.";
export const alertAssignmentAcceptError: string =
  "No se pudo aceptar la asignación.";
export const alertAssignmentRejectError: string =
  "No se pudo rechazar la asignación.";
export const alertRouteFetchError: string = "No se pudo obtener la ruta.";
export const alertWaitingForLocation: string =
  "Aún no se ha obtenido tu ubicación GPS. Espera unos segundos e inténtalo de nuevo.";
export const alertLocationTrackerError: string =
  "No es posible obtener la ubicación de manera automática, por favor asegúrate de tener la ubicación activada en tu dispositivo y autorizar la aplicación para ello.";
export const alertNotificationPermissionDenied: string = "Permiso de notificación denegado. Es posible que no recibas actualizaciones de estado de emergencia.";

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

// PQRS (Petition, Queue, Request, Suggestion)
export const pqrsTitle: string = "PQRS";
export const pqrsTypeLabel: string = "Tipo de Solicitud";
export const pqrsPhoneLabel: string = "Contacto";
export const pqrsMessageLabel: string = "Mensaje:";
export const pqrsPhonePlaceholder: string = "Ingresa tu número de teléfono";
export const pqrsMessagePlaceholder: string =
  "Describe lo que piensas en detalle...";
export const pqrsBtnSubmit: string = "Enviar";
export const pqrsBtnSubmitting: string = "Enviando...";

// PQRS Type options
export const pqrsTypeError: string = "Reporte de Error";
export const pqrsTypeQuestion: string = "Pregunta";
export const pqrsTypeSuggestion: string = "Sugerencia";

// PQRS Validation messages
export const validationPQRSTypeRequired: string =
  "Por favor selecciona un tipo de envío";
export const validationPQRSPhoneRequired: string =
  "El número de teléfono es obligatorio";
export const validationPQRSMessageRequired: string =
  "El mensaje es obligatorio";
export const validationPQRSMessageMinLength: string =
  "El mensaje debe tener al menos 10 caracteres";
export const validationPQRSPhoneDigits: string =
  "El número de teléfono debe tener exactamente 10 dígitos";

// PQRS Alerts
export const alertPQRSSuccess: string = "Envío exitoso";
export const alertPQRSSuccessMessage: string =
  "Tu PQRS ha sido recibida correctamente";
export const alertPQRSError: string = "Error en el envío";
export const alertPQRSErrorMessage: string =
  "Hubo un error al enviar tu PQRS. Por favor intenta nuevamente";
export const pqrsTypes: Record<PQRSSubmissionType, string> = {
  [PQRSSubmissionType.ERROR]: pqrsTypeError,
  [PQRSSubmissionType.QUESTION]: pqrsTypeQuestion,
  [PQRSSubmissionType.SUGGESTION]: pqrsTypeSuggestion,
};

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

// Notifications — one title+body pair per emergency status
export const notificationReceivedTitle: string = "Emergencia recibida";
export const notificationReceivedBody: string = "Recibimos tu alerta. Se está organizando la ayuda.";
export const notificationDispatchedTitle: string = "Equipo enviado";
export const notificationDispatchedBody: string = "Un equipo paramédico ha sido asignado y se está preparando para salir.";
export const notificationOnRouteTitle: string = "Ayuda en camino";
export const notificationOnRouteBody: string = "Los paramédicos vienen hacia ti. Quédate donde estás y mantén la calma.";
export const notificationOnSiteTitle: string = "Ayuda ha llegado";
export const notificationOnSiteBody: string = "El equipo paramédico está ahora contigo.";
export const notificationClosedTitle: string = "Emergencia finalizada";
export const notificationClosedBody: string = "La emergencia ha sido resuelta. Cuídate.";
export const notificationCancelledTitle: string = "Emergencia cancelada";
export const notificationCancelledBody: string = "Este caso de emergencia ha sido cerrado.";

// Operator dashboard — control bar / layout
export const operatorNoEmergencySelected = "Selecciona una alerta para ver las acciones disponibles";
export const operatorCallCitizen = "Llamar ciudadano";
export const operatorCallParamedic = "Llamar paramédico";
export const operatorCallHospital = "Llamar hospital";
export const operatorDoTriage = "Realizar triaje";
export const operatorEditEmergency = "Editar Emergencia";
export const operatorAssignParamedic = "Asignar paramédico";
export const operatorCloseCase = "Cerrar caso";
export const operatorEnRoute = "En ruta";
export const operatorSendTriage = "Enviar triaje";
export const operatorEditTitle = "Editar Emergencia";
export const operatorTriageIncomplete = "Debes responder todas las preguntas antes de enviar el triaje.";
export const operatorToastEmergencyReceived = "Nueva emergencia recibida";
export const operatorToastParamedicAccepted = "Paramédico aceptó la asignación";
export const logout = "Cerrar sesión";

// Operator dashboard — detail panel & confirm modal
export const operatorActiveAlerts = "Alertas activas";
export const operatorAlertsCount = (n: number) => `${n} ${n === 1 ? "alerta" : "alertas"}`;
export const operatorTakeAlertTitle = "¿Tomar esta alerta?";
export const operatorTakeAlertNote = "Al confirmar, esta alerta será asignada a tu sesión y podrás gestionar las operaciones correspondientes.";
export const operatorTakeAlertAction = "Tomar alerta";
export const operatorAlertLabel = (id: string) => `Alerta ALT-${id.slice(-3)}`;
export const operatorSectionStatus = "Estado";
export const operatorSectionPatient = "Paciente";
export const operatorSectionAge = "Edad";
export const operatorSectionPhone = "Teléfono";
export const operatorSectionLocation = "Ubicación";
export const operatorSectionReportTime = "Hora reporte";
export const operatorSectionTriage = "Triaje";
export const operatorSectionParamedic = "Paramédico asignado";
export const operatorSectionNotes = "Notas";
export const operatorNotesPlaceholder = "Agregar observaciones...";
export const operatorEtaLabel = (min: number) => `ETA: ${min} min`;
export const operatorMinutesAgo = (n: number) => `hace ${n} min`;
export const operatorCancelAlert = "Cancelar alerta";
export const operatorViewTriage = "Ver triaje";
export const operatorTriagePriorityCritical = "Crítico";
export const operatorTriagePriorityUrgent = "Urgente";
export const operatorTriagePriorityMild = "Leve";
export const operatorTriageResultPrefix = "Resultado";
export const navTooltipAlerts = "Alertas";
export const navTooltipQueue = "Cola de alertas";
export const navTooltipMyAlerts = "Mis alertas";
export const navTooltipHospitals = "Hospitales";
export const navTooltipParamedics = "Paramédicos";
export const navTooltipAnalytics = "Análisis";
export const navTooltipHistory = "Historial";
export const navTooltipSettings = "Configuración";
export const navTooltipLogout = "Cerrar sesión";

// Operator dashboard — multi-alert workflow
export const operatorQueueTitle = "Cola de alertas";
export const operatorMyAlertsTitle = "Mis alertas";
export const operatorMyAlertsCount = (n: number) => `${n} ${n === 1 ? "alerta" : "alertas"}`;
export const operatorMyAlertsEmpty = "Aún no has tomado ninguna alerta";
export const operatorAssignedAgo = (n: number) => `asignada hace ${n} min`;
export const operatorTrackerTitle = "Mis alertas activas";
export const operatorTrackerToggleOpen = "Mostrar mis alertas";
export const operatorTrackerToggleClose = "Ocultar";

export const paramedicStatusLabels: Record<string, string> = {
  AVAILABLE:      "Disponible",
  ON_ROUTE:       "En curso",
  OUT_OF_SERVICE: "Fuera de servicio",
};

// Triage questions
export const triageQ_dizziness = "¿Se siente mareado?";
export const triageQ_bleeding = "¿Hay sangrado visible?";
export const triageQ_blurred_vision = "¿Tiene visión borrosa?";
export const triageQ_unconscious = "¿Está inconsciente?";
export const triageQ_difficulty_breathing = "¿Dificultad para respirar?";
export const triageQ_fracture = "¿Tiene alguna fractura visible?";
export const triageQ_chest_pain = "¿Dolor en el pecho?";
export const triageQ_numbness_limbs = "¿Tiene entumecimiento en las extremidades?";

// Edit emergency fields
export const editLabel_fullName = "Nombre completo";
export const editLabel_estimatedAge = "Edad estimada";
export const editLabel_knownConditions = "Antecedentes conocidos";
export const editLabel_observations = "Observaciones";
export const editPlaceholder_fullName = "Nombre del paciente";
export const editPlaceholder_estimatedAge = "Ej: 45 años";
export const editPlaceholder_knownConditions = "Ej: hipertensión, diabetes";
export const editPlaceholder_observations = "Notas adicionales";

// --- Prehospital care flow (paramedic) ---

export const complexityScreenTitle = "Nivel de complejidad";
export const complexityScreenSubtitle = "Asigna un nivel a esta emergencia";
export const complexityBasic = "Básico";
export const complexityIntermediate = "Intermedio";
export const complexityHigh = "Alto";
export const complexityBasicDesc = "Atención primaria, sin riesgo vital";
export const complexityIntermediateDesc = "Requiere atención especializada";
export const complexityHighDesc = "Riesgo vital, atención de alta complejidad";

export const transferScreenTitle = "Trasladar a centro médico";
export const transferScreenSubtitle = "Selecciona el centro receptor";
export const transferEmptyState = "No hay centros médicos disponibles";
export const transferLoadError = "No se pudieron cargar los centros médicos";
export const transferAvailableSlots = "Camas disponibles";
export const transferConfirm = "Confirmar traslado";
export const transferSearchTitle = "Buscar dirección";
export const transferSearchPlaceholder = "Escribe una dirección...";
export const transferSearchEmpty = "Sin resultados";
export const transferSearchUnavailable =
  "La búsqueda de direcciones no está disponible (falta configurar MapTiler).";

export const careReportTitle = "Reporte prehospitalario";
export const careReportSubtitle = "Información para el centro médico";
export const careReportInitialState = "Estado inicial del paciente";
export const careReportInitialStatePlaceholder = "Describa el estado inicial";
export const careReportTreatment = "Tratamiento aplicado";
export const careReportTreatmentPlaceholder = "Describa el tratamiento";
export const careReportFinalState = "Estado final";
export const careReportFinalStateDesc = "Notas sobre el estado final";
export const careReportFinalStateDescPlaceholder = "Observaciones adicionales";
export const careReportSubmit = "Enviar reporte";
export const careReportSubmitting = "Enviando…";
export const careReportSuccess = "Reporte enviado";
export const careReportError = "No se pudo enviar el reporte";

export const patientStatusCritical = "Crítico";
export const patientStatusDeteriorating = "Deteriorando";
export const patientStatusStable = "Estable";
export const patientStatusImproving = "Mejorando";

export const validationCareInitialRequired = "Describe el estado inicial";
export const validationCareTreatmentRequired = "Describe el tratamiento aplicado";
export const validationCareFinalDescRequired = "Describe el estado final";

export const stepArrivalDone = "Llegada confirmada";
export const stepAssignComplexity = "Asignar complejidad";
export const stepTransfer = "Trasladar";
export const stepReportCare = "Reportar atención";

