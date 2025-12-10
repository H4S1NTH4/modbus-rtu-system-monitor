// Logic for CRC-16 (Modbus)
// to validate incomming requests
// to sign responses
unsigned short calculateCRC(unsigned char *buffer, int length) {
    unsigned short crc = 0xFFFF;
    for (int pos = 0; pos < length; pos++) {
        crc ^= (unsigned short)buffer[pos];
        for (int i = 8; i != 0; i--) {
            if ((crc & 0x0001) != 0) {
                crc >>= 1;
                crc ^= 0xA001;
            } else {
                crc >>= 1;
            }
        }
    }
    return crc;
}






