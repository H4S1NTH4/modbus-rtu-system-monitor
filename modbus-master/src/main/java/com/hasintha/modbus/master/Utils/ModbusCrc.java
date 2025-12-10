package com.hasintha.modbus.master.Utils;

public class ModbusCrc {

     //Calculates the CRC-16 (Modbus) checksum.
     //Logic: XOR with 0xFFFF, shift right, apply polynomial 0xA001.
    public static int calculate(byte[] data, int length) {
        int crc = 0xFFFF;

        for (int pos = 0; pos < length; pos++) {
            crc ^= (data[pos] & 0xFF); //XOR byte into LSB of crc

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
     //Appends the calculated CRC to the end of the buffer.
     //Important: Modbus sends CRC as Low Byte first, then High Byte (Little Endian).
    public static void appendCrc(byte[] buffer, int lengthWithoutCrc) {
        int crc = calculate(buffer, lengthWithoutCrc);
        buffer[lengthWithoutCrc] = (byte) (crc & 0xFF);         // Low Byte
        buffer[lengthWithoutCrc + 1] = (byte) ((crc >> 8) & 0xFF); // High Byte
    }
}