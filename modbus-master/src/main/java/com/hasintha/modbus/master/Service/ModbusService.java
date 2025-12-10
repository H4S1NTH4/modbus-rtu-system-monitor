package com.hasintha.modbus.master.Service;

import com.hasintha.modbus.master.Utils.ModbusCrc;
import org.springframework.stereotype.Service;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.Socket;

@Service
public class ModbusService {

    private static final int TIMEOUT = 2000; // 2 seconds timeout

    /**
     * Reads a single 16-bit register from the Modbus Slave using raw TCP.
     * @param ip The slave IP address
     * @param registerAddr The register address (0x04, 0x06, 0x08)
     * @return The scaled value (e.g. 45.5) or throws Exception
     */
    public double readRegister(String ip, int registerAddr) throws Exception {
        // Use try-with-resources to ensure the socket ALWAYS closes
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(ip, 5000), TIMEOUT);
            socket.setSoTimeout(TIMEOUT);

            OutputStream out = socket.getOutputStream();
            InputStream in = socket.getInputStream();

            // --- 1. Construct Request Frame (8 Bytes) ---
            // [SlaveID(1)][Func(1)][AddrHi(1)][AddrLo(1)][CntHi(1)][CntLo(1)][CrcLo(1)][CrcHi(1)]
            byte[] request = new byte[8];
            request[0] = 0x01;  // Slave ID (Fixed as 1 for this assignment)
            request[1] = 0x03;  // Function Code (Read Holding Registers)
            request[2] = (byte) ((registerAddr >> 8) & 0xFF);
            request[3] = (byte) (registerAddr & 0xFF);
            request[4] = 0x00;
            request[5] = 0x01;  // Count = 1 Register

            // Calculate and Append CRC
            ModbusCrc.appendCrc(request, 6);

            // Send
            out.write(request);

            // --- 2. Read Response ---
            // Expected Response for 1 register:
            // [SlaveID(1)][Func(1)][Bytes(1)][DataHi(1)][DataLo(1)][CrcLo(1)][CrcHi(1)] = 7 bytes
            byte[] response = new byte[256];
            int bytesRead = in.read(response);

            if (bytesRead < 7) {
                throw new Exception("Invalid response length: " + bytesRead);
            }

            // --- 3. Validate CRC ---
            // Extract CRC from the last 2 bytes received
            int receivedCrc = ((response[bytesRead - 1] & 0xFF) << 8) | (response[bytesRead - 2] & 0xFF);
            int calculatedCrc = ModbusCrc.calculate(response, bytesRead - 2);

            // Note: In a real production system, you would throw an exception here.
            // For the demo, if your Python test worked, this should match exactly.
            if (receivedCrc != calculatedCrc) {
                 throw new Exception("CRC Mismatch");
                        }

            // --- 4. Parse Value ---
            // Data is at index 3 (High) and 4 (Low)
            int high = response[3] & 0xFF;
            int low = response[4] & 0xFF;
            int rawValue = (high << 8) | low;

            return rawValue / 100.0; // Scale back to percentage (4500 -> 45.00)
        }
    }
}