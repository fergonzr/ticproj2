# Historias de Usuario para ROL: Ciudadano

---

## HU-C001: Activación de Alerta de Emergencia con Un Toque

**Descripción:**
Yo como paciente en situación de emergencia, necesito activar una alerta de emergencia con un solo toque desde mi dispositivo móvil, con la finalidad de solicitar ayuda inmediata sin tener que describir verbalmente mi estado en momentos de estrés o incapacidad física.

**Criterios de Aceptación:**
1. El botón de emergencia debe ser visible y accesible desde la pantalla principal de la aplicación
2. La activación debe requerir máximo 3 toques para confirmar y evitar activaciones accidentales
3. Debe existir confirmación visual y sonora de que la alerta fue enviada exitosamente
4. Debe existir opción de cancelación dentro de un tiempo prudente si fue activación accidental
5. Al activar, la aplicación debe dirigir automáticamente a una llamada con el operador de emergencias del sistema
6. Si la llamada al operador no es respondida en X segundos, la aplicación debe instruir al usuario a llamar directamente al 123
7. Debe bloquearse el envio de alertas durante un periodo prudente para evitar sobrecarga por una misma emergencia

---

## HU-C002: Geolocalización Automática y Precisa al Activar Alerta

**Descripción:**
Yo como paciente accidentado, necesito que mi ubicación sea capturada automáticamente al activar la alerta, con la finalidad de evitar tener que describir verbalmente dónde me encuentro cuando estoy desorientado, herido o en un lugar desconocido.

**Criterios de Aceptación:**
1. La geolocalización debe capturarse automáticamente sin requerir acción adicional del usuario
2. La precisión de la ubicación debe ser mínima de 10 metros en zonas urbanas
3. Debe funcionar con la aplicación en primer plano durante la activación de la emergencia
4. Debe mostrar al usuario la ubicación detectada para confirmación visual (opcional)

---

## HU-C003: Guía de Primeros Auxilios y Acompañamiento Emocional Durante la Espera

**Descripción:**
Yo como paciente o testigo en el lugar del accidente, necesito recibir instrucciones claras de primeros auxilios junto con mensajes de tranquilidad y acompañamiento mientras espero la ambulancia, con la finalidad de estabilizar mi condición o la de otros y reducir la ansiedad e incertidumbre durante la espera.

**Criterios de Aceptación:**
1. Las instrucciones deben presentarse en formato visual o audio para manos libres
2. Las instrucciones/consejos deben ser simples y cortas
3. Los mensajes de acompañamiento deben incluir información reconfortante ("La ambulancia está en camino", "No estás solo, te estamos monitoreando")
4. El contenido debe incluir instrucciones genéricas aplicables a escenarios comunes (inmovilización, control de sangrado, posición de espera)
5. El contenido debe cargarse rápidamente mientras la aplicación esté en uso activo durante la emergencia

---

## HU-C004: Notificación en Tiempo Real del Estado de la Ambulancia

**Descripción:**
Yo como paciente esperando ayuda, necesito recibir actualizaciones sobre el estado de la ambulancia asignada, con la finalidad de reducir mi ansiedad e incertidumbre sabiendo cuánto falta para que llegue la ayuda y quién viene en camino.

**Criterios de Aceptación:**
1. Debe mostrar el tiempo estimado de llegada (ETA) actualizado cada X segundos
2. Debe indicar el estado actual: "En camino", "Cerca del lugar", "Llegando"
3. Debe mostrar información básica del paramédico asignado (nombre, identificación)

---

## HU-C005: Registro de Información Médica Personal para Emergencias

**Descripción:**
Yo como usuario de la aplicación, necesito registrar mi información médica relevante (alergias, condiciones crónicas, medicamentos), con la finalidad de que el personal de emergencia tenga acceso inmediato a datos críticos que puedan salvar mi vida si estoy inconsciente.

**Criterios de Aceptación:**
1. Debe incluir campos para: alergias, condiciones crónicas, tipo de sangre, contacto de emergencia
2. La información debe almacenarse exclusivamente de forma local en el dispositivo del usuario hasta que se active una emergencia
3. La información debe transmitirse automáticamente al organismo que le competa al activar una alerta
4. Debe existir indicación clara al usuario sobre cuándo y a quién se envían sus datos médicos
5. Debe permitir actualizar la información en cualquier momento con validación de identidad

---

## HU-C006: Información Transparente sobre Hospital Destino

**Descripción:**
Yo como paciente siendo trasladado, necesito saber a qué hospital me están llevando y por qué fue seleccionado, con la finalidad de entender el proceso, reducir mi ansiedad y poder informar a mis familiares sobre mi paradero.

**Criterios de Aceptación:**
1. Debe mostrar nombre y dirección del hospital asignado
2. Debe mostrar tiempo estimado de llegada al hospital
3. La información debe estar disponible antes de iniciar el traslado

---

## HU-C007: Confirmación y Cierre del Caso Post-Atención

**Descripción:**
Yo como paciente atendido, necesito recibir confirmación de que mi caso fue cerrado correctamente en el sistema, con la finalidad de tener tranquilidad de que mi atención no quedó abierta.

**Criterios de Aceptación:**
1. Debe enviar notificación de cierre de caso 
2. Debe incluir resumen básico de la atención (hora de llegada, hospital destino)
3. Debe permitir descargar o compartir un comprobante de atención

---

