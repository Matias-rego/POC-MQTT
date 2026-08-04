# POC Real-time comunication: MQTT
# Integrantes: 
## Objetivos y alcance

El presente informe forma parte de una **Prueba de Concepto (PoC)** intergrupal cuyo objetivo es investigar y evaluar la conveniencia práctica de distintas tecnologías de comunicación en tiempo real. 
Cada grupo aborda una tecnología del mismo tema y, en conjunto, se elabora una comparación y una conclusión general que permita a un equipo de desarrollo decidir con evidencia —y no solo con argumentos teóricos— qué tecnología conviene adoptar para un problema dado.

**Este documento cubre específicamente la tecnología MQTT (Message Queuing Telemetry Transport):** qué problema resuelve, cómo funciona internamente, qué garantías ofrece, con qué herramientas se implementa, en qué escenarios brilla y cuáles son sus límites frente a las demás tecnologías del mismo tema: WebSocket, Server-Sent Events (SSE) y WebRTC. El documento esta orientado a que un desarrollador pueda entender el protocolo lo suficientemente a fondo como para justificar (o descartar) su uso, e incluye una demostración práctica de implementación.

### Alcance del informe
***Qué se incluye:*** modelo de comunicación tradicional como punto de partida, fundamentos y características del protocolo, modelo publish/subscribe, arquitectura del broker, topics y comodines, niveles de calidad de servicio (QoS), mensajes retenidos y "últimas voluntades", novedades de MQTT 5.0, seguridad, brokers disponibles, una demostración práctica con Mosquitto y Python, y la comparación con otras tecnologías de tiempo real.

## Introducion

Para entender por qué existen tecnologías como **MQTT** conviene partir del modelo clásico de la web: HTTP, basado en petición-respuesta (request/response). En este esquema, el cliente (por ejemplo, un navegador) siempre inicia la comunicación: envía una petición y el servidor responde. El servidor nunca puede tomarla iniciativa de enviar datos por su cuenta.
Cuando necesitamos información que cambia constantemente —el precio de una acción, la temperatura de un sensor, un mensaje nuevo— este modelo obliga a hacer polling: el cliente pregunta una y otra vez _"¿hay novedades?"_, la mayoría de las veces para recibir un _"no"_. Esto desperdicia ancho de banda, consume batería y agrega latencia (el dato viaja recién en la próxima consulta). Además, cada petición HTTP arrastra bastante "peso" en cabeceras.

Las **tecnologías de tiempo real** resuelven esta limitación permitiendo que la información fluya con la menor latencia posible y, según el caso, de forma bidireccional y orientada a eventos: el dato se envía cuando ocurre algo, no cuando alguien pregunta. En el tema de comunicación en tiempo real navegador-servidor que aborda esta PoC se investigan y comparan cuatro tecnologías:

- **WebSocket (socket.io / ws):** canal full-duplex persistente entre cliente y servidor.
- **Server-Sent Events (SSE):** flujo unidireccional servidor → cliente sobre HTTP, simple y con reconexión automática.
- **WebRTC (simple-peer / peerjs):** comunicación directa entre pares (P2P), pensada para audio, video y datos de muy baja latencia.
- **MQTT (mqtt.js):** publish/subscribe a través de un broker; en el navegador viaja sobre WebSocket.

Este informe se centra específicamente en **MQTT**: se profundiza en su funcionamiento, su integración en el navegador mediante mqtt.js y los resultados obtenidos al aplicarlo dentro de esta PoC, dejando el resto de las tecnologías mencionadas como marco comparativo de referencia.

## ¿Qué es MQTT?

**MQTT** (Message Queuing Telemetry Transport) es un protocolo de mensajería ligero, abierto y basado en el patrón publish/subscribe (publicar/suscribir). Funciona sobre TCP/IP y fue diseñado para entornos con ancho de banda limitado, alta latencia o redes poco fiables, con un consumo mínimo de recursos tanto en la red como en los dispositivos. Por eso encaja tan bien con microcontroladores pequeños como los ESP8266 o ESP32.

***Analogía:** Una buena analogía es un grupo de WhatsApp: en lugar de que todos hablen directamente entre sí, cada mensaje pasa por un "administrador" (el broker) que se encarga de reenviarlo solo a quienes realmente lo necesitan.*

Para dimensionar cuán liviano es: un mensaje MQTT puede pesar apenas unos pocos bytes (la cabecera fija mínima es de 2 bytes), mientras que una petición HTTP típica puede ocupar varios kilobytes. En situaciones donde "cada byte cuenta" —redes con ancho de banda limitado o dispositivos a batería— esa diferencia es decisiva.

**Historia:**
MQTT fue creado en 1999 por dos ingenieros de IBM, Andy Stanford-Clark y Arlen Nipper, que trabajaban en sistemas de monitoreo de oleoductos vía satélite. Necesitaban enviar datos en tiempo real desde sensores remotos, en lugares donde la conexión era mala y costosa; por eso diseñaron un protocolo ligero, eficiente y confiable.
Con el auge del IoT, MQTT trascendió la industria petrolera. En 2014 pasó a ser gestionado y estandarizado por OASIS (un consorcio de estándares tecnológicos abiertos); dos años después, en 2016, esa misma especificación (MQTT 3.1.1) fue aprobada también como estándar internacional ISO/IEC 20922. La versión vigente, MQTT 5.0, fue publicada como estándar OASIS el 7 de marzo de 2019; la anterior, MQTT 3.1.1, sigue muy usada y ambas conviven en producción. MQTT se mantiene abierto y gratuito, lo que impulsó su adopción masiva.

### Cuatro rasgos explican por qué MQTT se volvió tan popular en el mundo conectado:

1. **Es ligero**
   Necesita muy pocos recursos. A diferencia de HTTP —que envía muchos datos de control en cada mensaje— MQTT usa un formato compacto, ideal para dispositivos de baja potencia. Menos bytes significa menos consumo de red, menos memoria y menos batería.

2. **Es eficiente y tolera redes inestables**
   MQTT no transmite todo el tiempo: envía datos solo cuando hace falta. Si un sensor no cambia su valor, no tiene sentido saturar la red con lecturas repetidas. Además, funciona bien en conexiones poco estables (redes móviles o satelitales): gestiona los mensajes de forma inteligente para que lleguen incluso si la conexión se interrumpe momentáneamente, apoyándose en las sesiones persistentes y en los niveles de QoS que veremos más adelante.

3. **Corre sobre TCP/IP, en casi cualquier red**
   Al basarse en TCP/IP, MQTT puede funcionar sobre Wi-Fi, Ethernet, 4G/5G, LoRaWAN y prácticamente cualquier red compatible. Esto permite conectar desde un sensor en una granja hasta una aplicación en la nube sin problemas de compatibilidad. De hecho, los principales proveedores cloud (AWS, Google Cloud, IBM Cloud, Microsoft Azure) ofrecen soporte para MQTT.

4. **Ofrece calidad de servicio (QoS)**
   MQTT permite elegir cuánta garantía queremos de que un mensaje llegue, con tres niveles que van desde "enviar sin confirmación" hasta "garantizar entrega exactamente una vez". Esto lo hace muy flexible: cada mensaje puede usar el nivel adecuado a su criticidad. Se detalla en la sección 7.

## Arquitectura general

### El **broker** y el modelo **publish/subscribe**

En MQTT los clientes nunca se comunican directamente entre sí. Todo pasa por un componente central llamado broker. Un cliente que genera datos (publisher) publica mensajes en un topic, y el broker los reenvía a todos los clientes que se hayan suscripto (subscriber) a ese topic. Un mismo cliente puede ser publisher y subscriber a la vez.
Este desacoplamiento es la clave de MQTT y ocurre en tres dimensiones:

1. **En el espacio:** (publisher y subscriber no necesitan conocerse ni saber la IP del otro).

2. **En el tiempo:** (no necesitan estar conectados a la vez, gracias a sesiones persistentes y mensajes retenidos)

3. **En la sincronización:** (publicar no bloquea al emisor). Por eso escala a miles o millones de dispositivos sin acoplarlos.

### ¿Por qué usar un intermediario?

A primera vista, meter un intermediario parece complejo. La ventaja es el **desacoplamiento**, como tambien la flexibilidad y la escalabilidad.

***Analogia:** Imaginá una lista de correo con distintos boletines —por ejemplo "ofertas", "soporte", "noticias"—. Publicás un mensaje una sola vez en el boletín que corresponde, y les llega automáticamente a todos los que estén suscriptos a ese boletín en particular, sin que tengas que saber quiénes son ni escribirle a cada uno.*

Con MQTT, cada sensor solo publica al broker y cualquier sistema que necesite esa información se suscribe, sin que los sensores tengan que saber quién los escucha. Agregar o quitar dispositivos no obliga a reconfigurar el resto: el nuevo simplemente se suscribe al topic que le interesa.

### Topics y comodines

Los topics son cadenas de texto jerárquicas separadas por barras que actúan como "direcciones postales" de los mensajes, por ejemplo casa/habitacion1/temperatura. No hay que declararlos de antemano: se crean al publicar o suscribir. Un sensor publica en su topic y cada app se suscribe solo a los topics que le interesan, como si fueran distintos buzones.

Para suscribirse a varios topics a la vez existen comodines (wildcards):

- __Comodin de un solo nivel (**_+_**):__ casa/+/temperatura captura la temperatura de cualquier habitación (sala, cocina, etc.), pero solo de ese nivel exacto.

- __*Comodin multinivel (**_#_**):__ casa/# captura absolutamente todo lo que cuelga de casa, sin importar cuántos niveles tenga después.

![](https://mqtt.org/assets/img/mqtt-publish-subscribe.png)

### Retained Messages

Cuando un publisher envía un mensaje con la bandera **_retained_** activada, el broker guarda ese último mensaje del topic. Así, cualquier cliente que se suscriba después recibe de inmediato el último valor sin tener que esperar a la próxima publicación.
Es muy útil para conocer el "estado actual" de un sensor apenas te conectás, sin esperar a que publique de nuevo.

### Last Will and Testament (LWT)

Al conectarse, un cliente puede registrar un **mensaje de últimas voluntades** (LWT). Si se desconecta de forma inesperada (sin enviar un DISCONNECT ordenado), el broker publica automáticamente ese mensaje en el topic indicado, avisando al resto del sistema de la caída.

Es el mecanismo estándar para detectar dispositivos que se cayeron y reaccionar (activar respaldos, alertar a los usuarios, etc.).

### Keep Alive / Sesiones

Al conectarse, el cliente declara un **intervalo keep-alive**. Si no hay tráfico durante ese período, el cliente envía un PINGREQ para indicar que sigue vivo. Si el broker no recibe señales dentro de 1,5 veces ese intervalo, considera al cliente desconectado y dispara su mensaje de últimas voluntades (LWT).

### Sesiones limpias vs. persistentes:

Un cliente puede pedir una sesión persistente: en ese caso el broker recuerda sus suscripciones y almacena los mensajes de QoS 1 y 2 que llegaron mientras estaba desconectado, entregándolos al reconectarse. En una sesión limpia (clean), en cambio, no se guarda nada: al desconectarse se pierde el estado. Las sesiones persistentes son fundamentales en IoT, donde los dispositivos pierden conexión con frecuencia. En MQTT 5.0 esto se controla con el Session Expiry Interval, que define cuánto tiempo sobrevive la sesión tras una desconexión.

### Calidad de servicio (QoS) 

La **QoS** (Quality of Service) define la garantía de entrega de cada mensaje, es decir, cuánta certeza se quiere tener de que llegue a destino. Es una de las características más distintivas de MQTT, porque el nivel se fija por mensaje, permitiendo equilibrar la fiabilidad contra el consumo de recursos según la criticidad de cada dato. Existen tres niveles:

* **QoS 0 — "a lo sumo una vez" (at most once)**

El mensaje se envía una sola vez y no se confirma; si se pierde en el camino, no se reenvía. Es el nivel más rápido y liviano, con el menor overhead. Resulta adecuado para telemetría frecuente donde perder una lectura aislada no es relevante, por ejemplo una temperatura que se publica cada segundo: si falta un dato, el siguiente lo reemplaza enseguida.

* **QoS 1 — "al menos una vez" (at least once)**

El publicador espera una confirmación (PUBACK) del broker; si no la recibe dentro de un tiempo, reenvía el mensaje. Garantiza que el mensaje llegue, aunque puede entregarse duplicado, por lo que el receptor debe estar preparado para descartar repetidos. Se usa cuando no se puede perder información pero se toleran duplicados, como en la orden de activar un actuador.

* **QoS 2 — "exactamente una vez" (exactly once)**

Es el nivel más seguro y también el más costoso. Garantiza que el mensaje se entregue una única vez, sin pérdidas ni duplicados, mediante un intercambio de cuatro pasos: 'PUBLISH' → 'PUBREC' → 'PUBREL' → 'PUBCOMP'. Se reserva para mensajes críticos —una transacción o una orden de control industrial— donde un duplicado o una pérdida tendrían consecuencias.

A mayor nivel de QoS, mayor fiabilidad, pero también mayor latencia y consumo de red por los paquetes de control adicionales. Por eso la buena práctica es elegir el nivel según la criticidad de cada mensaje y no aplicar uno único a todo el sistema. En nuestra demo, por ejemplo, los controles publican con QoS 0, suficiente para la actualización continua de valores en la interfaz.

**Tabla resumen de los niveles de QoS**

| Nivel | Garantía | Cómo funciona | Duplicados | Cuándo usarlo |
|---|---|---|---|---|
| **QoS 0** | A lo sumo una vez | Se envía sin confirmación; si se pierde, no se reenvía | No | Datos frecuentes donde perder uno no importa (telemetría) |
| **QoS 1** | Al menos una vez | Se reenvía hasta recibir el `PUBACK` | Posibles | No se puede perder el mensaje, pero se toleran duplicados |
| **QoS 2** | Exactamente una vez | Handshake de 4 pasos: `PUBLISH` → `PUBREC` → `PUBREL` → `PUBCOMP` | No | Mensajes críticos (transacciones, control) |



## MQTT sobre otros protocolos

MQTT es un protocolo que no define cómo viajan los bits por el cable, sino qué formato tienen los mensajes y qué reglas siguen. Para efectivamente moverse entre cliente y broker, necesita apoyarse en un transporte de una capa inferior que se encargue de abrir la conexión y garantizar que los bytes lleguen en orden. Que MQTT "corra sobre" un protocolo significa justamente eso: sus paquetes viajan encapsulados dentro de las conexiones de ese otro protocolo, que actúa como vehículo, sin que la lógica de MQTT (topics, QoS, suscripciones) se entere ni cambie.

El transporte "clásico" es TCP/IP puro: el cliente abre un socket TCP directo contra el broker y los paquetes MQTT viajan ahí sin ninguna envoltura adicional. Pero no siempre es posible o conveniente abrir ese socket  y para esos casos MQTT se adapta corriendo sobre otros protocolos que resuelven ese problema puntual:

* **MQTT sobre WebSocket:** Un navegador no puede abrir un socket TCP crudo, así que para llevar MQTT a la web se lo encapsula dentro de una conexión WebSocket. El protocolo en sí no cambia —los mismos paquetes CONNECT, PUBLISH, SUBSCRIBE viajan intactos dentro de los frames de WebSocket—, por lo que un cliente conectado así puede interactuar sin problemas con clientes conectados por TCP normal, compartiendo los mismos topics. Es exactamente lo que hace mqtt.js en esta PoC para que el frontend hable con el broker.

* **MQTT-SN (MQTT for Sensor Networks):** Una variante pensada para redes donde ni siquiera TCP es viable —dispositivos de muy bajos recursos sobre Zigbee, redes de sensores inalámbricas o enlaces UDP—. Reemplaza el transporte por UDP y simplifica aún más el protocolo, apoyándose en una pasarela (gateway) que traduce hacia MQTT estándar para que el broker no note la diferencia.

* **MQTT sobre QUIC:** Una incorporación más reciente (soportada por ejemplo en EMQX y NanoMQ) que usa QUIC en lugar de TCP como transporte. Al evitar el *head-of-line blocking* de TCP y reducir el tiempo de establecimiento de conexión, mejora el comportamiento en redes móviles inestables donde reconectar constantemente sale caro.

En los tres casos, lo que cambia es el transporte subyacente; el modelo publish/subscribe, los topics y el resto de la semántica de MQTT se mantienen iguales. El cifrado (TLS) es independiente de esta elección: se puede sumar sobre TCP (puerto 8883) o sobre WebSocket (puerto 8084, "wss"), mientras que QUIC ya lo incorpora de forma nativa. Ese tema se retoma en detalle en la sección de Seguridad.

## Seguridad en MQTT

**MQTT** es un protocolo deliberadamente minimalista, por lo que no incorpora seguridad "de fábrica": la delega en mecanismos estándar de las capas inferiores y en la configuración del broker. Se apoya en tres pilares —cifrado, autenticación y autorización—

**_Cifrado de transporte (TLS/SSL):_** Sin cifrado, los mensajes —y también el usuario y la contraseña del CONNECT— viajan en texto plano y pueden ser interceptados. Por eso se usa TLS sobre TCP, la misma relación que hay entre HTTPS y HTTP. Los puertos habituales son 8883 para MQTT sobre TLS y 8084 para MQTT sobre WebSockets con TLS ("wss").

TLS trabaja en dos etapas. Primero, el **handshake**: broker y cliente negocian la versión de TLS y el cifrado a usar, y el broker presenta su certificado (una especie de "DNI digital" que contiene su clave pública y está firmado por una autoridad certificadora, o CA). El cliente valida esa firma siguiendo la cadena de confianza hasta una CA raíz en la que ya confía, y chequea que el nombre del certificado coincida con el del servidor al que se está conectando. Si algo no cierra —firma inválida, certificado vencido, nombre que no coincide—, el cliente corta la conexión antes de mandar ningún dato. Recién ahí, usando esa clave pública, ambos acuerdan una clave simétrica de sesión: la criptografía asimétrica (más costosa) solo se usa para "presentarse" e intercambiar esa clave; el resto de la conversación —incluido el CONNECT con usuario y contraseña— se cifra de forma simétrica, mucho más liviana para dispositivos con pocos recursos.

TLS aporta así tres garantías: confidencialidad (nadie lee el tráfico), integridad (nadie lo altera sin que se detecte) y autenticación del servidor, mediante ese certificado. Conviene exigir versiones modernas (TLS 1.2 o 1.3) y deshabilitar las antiguas.

**_Autenticación:_** Verifica la identidad de cada cliente que se conecta. Las opciones más comunes:

 * *Usuario y contraseña en el paquete CONNECT:* simple, pero solo seguro si viaja sobre TLS (de lo contrario, la contraseña va en claro).

 * *Certificados de cliente X.509 (mTLS):* el mismo handshake TLS puede extenderse en el otro sentido: el broker exige y valida un certificado del propio cliente antes de aceptar la conexión, quedando la identidad atada a una clave privada que nunca sale del dispositivo. Es el esquema más fuerte y muy usado en IoT, porque cada dispositivo tiene una identidad criptográfica propia.

 * *Autenticación mejorada (Enhanced Authentication) en MQTT 5.0:* admite mecanismos tipo SASL (por ejemplo SCRAM) y flujos de desafío-respuesta. Muchos brokers integran además tokens JWT / OAuth 2.0 mediante plugins.

**_Autorización (ACLs):_** Una vez autenticado el cliente, hay que definir qué le está permitido. Se maneja con ACLs (listas de control de acceso) que otorgan permisos de lectura y/o escritura por topic. Por ejemplo, un sensor puede tener permiso solo para publicar en dispositivos/sensor01/#, y un dashboard solo para suscribirse (leer). Los brokers permiten reglas con patrones y variables como el usuario (%u) o el id de cliente (%c), de modo que cada cliente quede acotado a su propio espacio de topics siguiendo el principio de mínimo privilegio.

**Seguridad a nivel de aplicación**

TLS protege el mensaje "en tránsito", pero el broker sí ve el contenido. Para datos especialmente sensibles se puede cifrar el payload de extremo a extremo en la propia aplicación, de modo que solo emisor y receptor puedan leerlo y ni siquiera el broker tenga acceso al dato.


## Brokers disponibles

Para llevar **MQTT** a la práctica se necesita un broker (el servidor). Entre los brokers más relevantes:

* **_Eclipse Mosquitto:_** el más difundido. Muy liviano (~200 KB), fácil de instalar en Windows, Linux y Raspberry Pi. Soporta MQTT 5.0/3.1.1, TLS y WebSockets. Es el que usamos en la demo (corriendo en un contenedor Docker).

* **_EMQX:_** uno de los más escalables del mercado (arquitectura sin maestro, soporta MQTT 5.0, MQTT-SN y MQTT sobre QUIC; benchmarks de más de 100 millones de conexiones). Ideal para despliegues industriales y a gran escala.

* **_HiveMQ:_** robusto, en Java, con edición Community y Enterprise. Cumplimiento total de MQTT 5.0 y seguridad extensible (OAuth/JWT).

* **_VerneMQ / NanoMQ:_** alternativas de alto rendimiento; VerneMQ destaca por su clustering y NanoMQ por ser ultraligero para dispositivos de borde (edge).

### ¿Dónde se aloja el broker?

El broker puede desplegarse en distintos lugares según el objetivo:

* **En la nube:** Un servidor remoto accesible desde cualquier lugar con internet. Es lo habitual en soluciones de producción y a escala.

* **En una máquina local (PC/portátil):** Solo accesible dentro de la misma red. Se usa típicamente para pruebas y desarrollo, no como solución final.

* **En una Raspberry Pi o servidor local:** Como el caso anterior pero pensado para funcionamiento continuo y fiable; una opción común en despliegues caseros o industriales pequeños.


## Casos de uso típicos

**MQTT** es especialmente adecuado cuando hay muchos dispositivos, redes poco fiables y necesidad de bajo consumo. Ejemplos representativos:

* **_Domótica:_** luces inteligentes, sensores de movimiento, cámaras y enchufes. Un sensor publica la temperatura y, al superar un umbral, plataformas como Home Assistant o Node-RED envían un mensaje MQTT para encender el aire acondicionado.

* **_Industria 4.0 / IIoT:_** máquinas que reportan su estado en tiempo real (producción, atascos, fallas), enviando los datos por MQTT a un servidor central.

* **_Agricultura de precisión:_** sensores de humedad y clima en el campo que envían datos a la nube por red móvil o satelital.

* **_Vehículos y logística:_** seguimiento de flotas y telemetría vehicular sobre redes móviles.

* **_Mensajería móvil:_** históricamente, Facebook Messenger utilizó MQTT para entregar mensajes con baja latencia y bajo consumo de batería, incluso con mala conexion.

* **_Energía y smart cities:_** medidores inteligentes, alumbrado público y monitoreo ambiental distribuido.

## Comparación con otras tecnologías

Dentro del tema de comunicación en tiempo real navegador-servidor, cada tecnología resuelve un problema distinto:

| Tecnología | Modelo | Dirección | Fortaleza principal | Casos de uso tipicos |
|---|---|---|---|---|
| **MQTT** | Pub/Sub vía broker | Bidireccional | Liviano, fiable en redes malas, QoS | IoT, telemetría, muchos dispositivos |
| **WebSocket** | Conexión persistente cliente-servidor | Full-duplex | Estándar en el navegador, baja latencia | Apps web en tiempo real, chats, dashboards |
| **SSE** | Stream sobre HTTP | Servidor → cliente | Simple y con reconexión automática | Notificaciones y feeds de solo lectura |
| **WebRTC** | Peer-to-peer (con signaling) | Full-duplex | Comunicación directa entre pares, muy baja latencia, audio/video | Videollamadas, streaming y datos P2P |

## La demo

Como parte de la PoC montamos un dashboard web en tiempo real que se comunica con un broker MQTT propio. 

La demo tiene tres capas, y todas se comunican únicamente a través del broker:

 **El broker (Mosquitto en Docker)**. Levantamos Eclipse Mosquitto con docker-compose, sin instalar nada a mano. Está configurado con seguridad (allow_anonymous false, archivo de contraseñas y lista de control de acceso). El que usa el navegador es el del puerto 9001, que habla MQTT sobre WebSocket: es imprescindible porque desde el navegador no se puede abrir una conexión TCP "cruda" al puerto 1883. Junto al broker corre también mqttui, una interfaz web (puerto 8088) que permite ver en vivo todos los mensajes que circulan, muy útil para depurar.

**El frontend (React + TypeScript + Vite)**. Se conecta al broker con la librería mqtt.js. Un componente central (MqttProvider) abre una única conexión WebSocket y la comparte con toda la aplicación mediante un contexto y el hook useMqtt, que expone las funciones publish y subscribe y el estado connected. Sobre esa base hay tres tipos de control:

* ***Switches:*** un interruptor que publica ON/OFF en el topic switchN/state y, a la vez, se suscribe a ese mismo topic para reflejar el estado actual.

* ***Sliders:*** una barra de 0 a 255 que publica su valor en sliderN/value cada vez que se mueve.

* ***Gráfico:*** Va acumulando los valores que llegan y dibuja los últimos 30 segundos de datos en una curva en vivo.

**El dispositivo (ESP32 con sensor).** Un ESP32 se conecta al broker por WiFi y participa como un cliente más, cumpliendo dos roles. 

* ***Como sensor***, publica sus lecturas (por ejemplo, temperatura) cada pocos segundos en un topic propio —esp32/temperatura—, que el dashboard muestra en el gráfico en vivo junto con el resto de los datos. 

* ***Como actuador***, se suscribe a los topics de los switches (switchN/state): al accionar un interruptor en la web, el ESP32 recibe el ON/OFF y enciende o apaga una salida física (un LED o un relé). De este modo, el mismo tablero sirve para ver datos del mundo real y para controlar el dispositivo, siempre a través del broker.

**¿Cómo viaja un dato?**

Tomemos el ejemplo del gráfico. Cuando movés el Slider 3:

El frontend publica el nuevo valor en el topic slider3/value.
El broker recibe ese mensaje y lo reenvía a todos los clientes suscriptos a ese topic.
El componente del gráfico, que se suscribió a slider3/value al cargarse, recibe el valor, lo agrega a la serie y redibuja la curva al instante.

Lo importante es que **el slider y el gráfico nunca se comunican directamente:**  son dos clientes independientes que solo comparten un topic y el broker. Exactamente lo mismo pasa con el ESP32: cuando su sensor publica una lectura en esp32/temperatura, el gráfico la dibuja sin saber —ni necesitar saber— si el dato vino de un slider del navegador o de un dispositivo físico. Para el sistema, ambos son simplemente publicadores.

**Qué demuestra**

En muy pocas líneas de código, la demo pone en práctica los conceptos centrales del informe: el modelo *publish/subscribe*, el rol del *broker* como intermediario, la organización por *topics*, la *comunicación en tiempo real* y el *desacoplamiento* entre quien produce y quien consume los datos. Además, como los mensajes se publican de forma *retenida*, un cliente que se conecta más tarde recibe de inmediato el último valor de cada control.

Elegimos Mosquitto como broker por ser liviano, multiplataforma y muy simple de levantar, lo que lo hace ideal para una prueba de concepto.

## Conclusion

La investigación y la implementación de la PoC permitieron comprender no solo el funcionamiento de MQTT, sino también las decisiones de diseño que explican su eleccion por encima de otras tecnologias. MQTT resuelve un problema acotado y puntual —la comunicación eficiente y confiable entre numerosos clientes sobre redes limitadas o inestables— y lo hace con un conjunto reducido de mecanismos bien integrados: el modelo publish/subscribe, los niveles de QoS, los mensajes retenidos y el Last Will. La demo confirmó que, con una configuración simple, es posible tener publicadores y suscriptores intercambiando datos en tiempo real de forma estable.

A nuestro criterio, el aporte más valioso del protocolo es el desacoplamiento que introduce el broker. Esto quedó en evidencia en la demo: el control del navegador y el ESP32 publican sobre el mismo topic y el gráfico los procesa de manera indistinta, sin que ninguno conozca al otro. Esta propiedad simplifica la incorporación o el retiro de clientes y constituye una lección de arquitectura aplicable más allá de MQTT, en el diseño de sistemas orientados a eventos en general.

No obstante, la tecnología presenta limitaciones que conviene señalar. La seguridad no está habilitada por defecto: el cifrado (TLS), la autenticación y las ACLs deben configurarse explícitamente en el broker, lo que añade complejidad y exige cuidado para no exponer instalaciones inseguras. Tambien, el broker representa un punto único de falla, por lo que un despliegue productivo requeriría esquemas de clustering y alta disponibilidad. 

En relación con el tema de la PoC —comunicación en tiempo real navegador-servidor—, consideramos que MQTT no compite directamente con WebSocket, SSE o WebRTC, sino que ocupa un espacio distinto y a menudo complementario: es la opción más adecuada cuando intervienen sensores, actuadores o gran cantidad de dispositivos con conectividad deficiente, y suele combinarse con las demás (por ejemplo, MQTT en la capa de hardware y WebSocket en la del navegador). La conclusión general, por lo tanto, no es que exista una tecnología superior en abstracto, sino que la elección adecuada depende del problema a resolver. En ese sentido, el principal valor de la PoC fue desarrollar el criterio para analizar los requisitos antes de seleccionar la herramienta.

## Bibliografía y referencias

Curso práctico de MQTT. Fuente principal del enfoque didáctico. https://youtu.be/3x1GIqtRDLU

Aprender BIG DATA — Introducción a MQTT y Mosquitto. https://aprenderbigdata.com/mqtt-mosquitto/

Solectro — https://solectroshop.com/es/blog/
que-es-mqtt-el-protocolo-de-comunicacion-para-iot-n117

OASIS — https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html

Eclipse Mosquitto — Broker MQTT open source (descarga y documentación). https://mosquitto.org/

Eclipse Paho — https://eclipse.dev/paho/

EMQ — https://www.emqx.com/en/blog/

WebSocket.org — https://websocket.org/comparisons/

Wikipedia — MQTT. https://en.wikipedia.org/wiki/MQTT
