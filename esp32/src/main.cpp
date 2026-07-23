#include <Arduino.h>

void setup() {
    Serial.begin(115200);
}

void loop() {
    Serial.println("ESP32-C3 SuperMini OK");
    delay(1000);
}