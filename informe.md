# POC Real-time comunication: MQTT 


## Introdusion 

## Marco teórico de MQTT

### ¿Qué es MQTT? 
 origen, protocolo, para qué fue creado (contexto de bajo ancho de banda, IoT)
### Modelo de comunicación Publish/Subscribe 
 en qué se diferencia del modelo cliente-servidor tradicional (request/response)
### Arquitectura general 
 broker, publishers, subscribers, cómo se conectan entre sí
### Topics (temas) 
 estructura jerárquica, wildcards (+ y #)
### Niveles de QoS (Quality of Service) 
 QoS 0, 1 y 2, diferencias y cuándo usar cada uno
### Retained Messages 
 qué son y para qué sirven
### Last Will and Testament (LWT) 
 manejo de desconexiones inesperadas
### Keep Alive / Sesiones 
 cómo mantiene la conexión, sesiones persistentes vs. limpias
### Seguridad en MQTT 
 autenticación, TLS/SSL, ACLs
### Brokers disponibles 
 Mosquitto, EMQX, HiveMQ, etc. (mencionar cuál usaron en la demo)
### Casos de uso típicos 
 IoT, telemetría, sensores, aplicaciones de bajo consumo

## Investigación sobre MQTT