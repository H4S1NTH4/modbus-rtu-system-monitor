#ifndef CRC_H
#define CRC_H

#include <cstdint>

// CRC-16 calculation for Modbus RTU
// Uses polynomial 0xA001
unsigned short calculateCRC(unsigned char *buffer, int length);

#endif // CRC_H
