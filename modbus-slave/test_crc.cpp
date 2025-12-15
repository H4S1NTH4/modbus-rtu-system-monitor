#include <iostream>
#include "crc.h"

int main() {
    unsigned char buffer[] = {0x01, 0x03, 0x00, 0x04, 0x00, 0x01};
    
    uint16_t calculated_crc = calculateCRC(buffer, 6);
    
    std::cout << "Calculated CRC for 01 03 00 04 00 01: " << std::hex << calculated_crc << std::endl;
    std::cout << "In bytes (Low first): " << std::hex << (calculated_crc & 0xFF) << " " << ((calculated_crc >> 8) & 0xFF) << std::endl;
    
    return 0;
}