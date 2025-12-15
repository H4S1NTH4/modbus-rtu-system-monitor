 //Assignment: Modbus RTU (over TCP) Slave
 //Candidate: Hasintha Dilshan

#include <iostream>           // Input/output streams (std::cout, std::cerr)
#include <string>             // String handling (std::string)
// #include <vector>             // Dynamic arrays (not heavily used here)
#include <cstring>            // C-style string functions (memset)
#include <unistd.h>           // Unix API (read, write, close)
#include <sys/socket.h>       // Socket programming
#include <netinet/in.h>       // IPv4 structures (sockaddr_in)
#include <arpa/inet.h>        // IP address conversion
#include <fstream>            // File input (std::ifstream for /proc/stat)
#include <sstream>            // String streams (parsing CPU stats)
#include <sys/statvfs.h>      // Filesystem info (disk usage)
#include <thread>             // Threading (std::this_thread)
#include <chrono>             // Time functions (sleep_for)
#include <iomanip>            // I/O manipulation (formatting output)
#include "crc.h"              // Custom CRC calculation

#define PORT 5000
#define BUFFER_SIZE 256

// --- 1. System Metrics Implementation ---

// Helper to read CPU stats
struct CpuData {
    unsigned long long user, nice, system, idle, iowait, irq, softirq, steal;
};

CpuData readCpuStats() {
    std::ifstream file("/proc/stat");
    std::string line;
    std::getline(file, line); // Read first line: "cpu ..."
    std::istringstream iss(line);
    std::string label;
    CpuData d;
    iss >> label >> d.user >> d.nice >> d.system >> d.idle >> d.iowait >> d.irq >> d.softirq >> d.steal;
    return d;
}

// Register 0x04: CPU Usage (0.00 - 100.00)
// Returns value scaled by 100 (e.g., 45.5% = 4550)
uint16_t getCpuUsage() {
    CpuData t1 = readCpuStats();
    std::this_thread::sleep_for(std::chrono::milliseconds(200)); // Short sample time
    CpuData t2 = readCpuStats();

    unsigned long long idle1 = t1.idle + t1.iowait;
    unsigned long long total1 = t1.user + t1.nice + t1.system + idle1 + t1.irq + t1.softirq + t1.steal;

    unsigned long long idle2 = t2.idle + t2.iowait;
    unsigned long long total2 = t2.user + t2.nice + t2.system + idle2 + t2.irq + t2.softirq + t2.steal;

    double totalDelta = total2 - total1;
    double idleDelta = idle2 - idle1;

    if (totalDelta == 0) return 0;

    double usage = 100.0 * (1.0 - (idleDelta / totalDelta));
    return (uint16_t)(usage * 100);
}

// Register 0x06: RAM Usage
// Returns value scaled by 100
uint16_t getRamUsage() {
    std::ifstream file("/proc/meminfo");
    std::string token;
    unsigned long total = 0, available = 0;

    while (file >> token) {
        if (token == "MemTotal:") file >> total;
        if (token == "MemAvailable:") file >> available;
    }

    if (total == 0) return 0;
    double percent = 100.0 * (1.0 - ((double)available / total));
    return (uint16_t)(percent * 100);
}

// Register 0x08: Disk Usage
// Returns value scaled by 100
uint16_t getDiskUsage() {
    struct statvfs stat;
    if (statvfs("/", &stat) != 0) {
        return 0;
    }
    double total = stat.f_blocks * stat.f_frsize;
    double free = stat.f_bfree * stat.f_frsize;
    if (total == 0) return 0;

    double percent = 100.0 * (1.0 - (free / total));
    return (uint16_t)(percent * 100);
}

// --- 2. Modbus RTU over TCP Handling ---

// Process a complete Modbus frame
void processFrame(unsigned char* frame, int frameLen, int mySlaveId, int clientSocket) {
    // 1. Validate Slave ID
    int receivedSlaveId = frame[0];
    if (receivedSlaveId != mySlaveId) {
        std::cout << "Ignored ID: " << receivedSlaveId << ", expected: " << mySlaveId << std::endl;
        return;
    }

    // 2. Parse Request
    int functionCode = frame[1];
    uint16_t startAddr = (frame[2] << 8) | frame[3]; // Big Endian
    uint16_t count = (frame[4] << 8) | frame[5];     // Big Endian

    std::cout << "Request: Func=" << functionCode
              << " Addr=0x" << std::hex << startAddr
              << " Count=" << std::dec << count << std::endl;

    // Only supporting Read Holding Registers (0x03) or Input Registers (0x04)
    if (functionCode != 0x03 && functionCode != 0x04) {
        std::cout << "Unsupported function code: " << functionCode << std::endl;

        // Send Modbus Exception Response
        // Format: [SlaveID][FuncCode+0x80][ExceptionCode][CRC_Lo][CRC_Hi]
        unsigned char exceptionResponse[5];
        exceptionResponse[0] = (unsigned char)mySlaveId;
        exceptionResponse[1] = (unsigned char)(0x80 | functionCode); // Set high bit
        exceptionResponse[2] = 0x01; // Exception Code 0x01: Illegal Function

        uint16_t excCrc = calculateCRC(exceptionResponse, 3);
        exceptionResponse[3] = excCrc & 0xFF;        // CRC Lo
        exceptionResponse[4] = (excCrc >> 8) & 0xFF; // CRC Hi

        write(clientSocket, exceptionResponse, 5);
        std::cout << "Sent exception response (Illegal Function)" << std::endl;
        return;
    }

    // Additional validation for count
    if (count == 0 || count > 125) { // Modbus standard max is 125 registers
        std::cout << "Invalid count: " << count << std::endl;

        // Send exception response for illegal data value
        unsigned char exceptionResponse[5];
        exceptionResponse[0] = (unsigned char)mySlaveId;
        exceptionResponse[1] = (unsigned char)(0x80 | functionCode); // Set high bit
        exceptionResponse[2] = 0x03; // Exception Code 0x03: Illegal Data Value

        uint16_t excCrc = calculateCRC(exceptionResponse, 3);
        exceptionResponse[3] = excCrc & 0xFF;        // CRC Lo
        exceptionResponse[4] = (excCrc >> 8) & 0xFF; // CRC Hi

        write(clientSocket, exceptionResponse, 5);
        std::cout << "Sent exception response (Illegal Data Value)" << std::endl;
        return;
    }

    // Prepare Response
    // [SlaveID][FuncCode][ByteCount][Data...][CRC_Lo][CRC_Hi]
    unsigned char response[256];
    int respIdx = 0;

    response[respIdx++] = (unsigned char)mySlaveId;
    response[respIdx++] = (unsigned char)functionCode;
    response[respIdx++] = (unsigned char)(count * 2); // Byte count (2 bytes per register)

    // Loop through requested registers
    for (int i = 0; i < count; i++) {
        uint16_t currentAddr = startAddr + i;
        uint16_t value = 0;

        if (currentAddr == 0x04) value = getCpuUsage();
        else if (currentAddr == 0x06) value = getRamUsage();
        else if (currentAddr == 0x08) value = getDiskUsage();
        else value = 0xFFFF; // Unknown register - return maximum value to indicate error

        // Modbus Data is Big Endian (High Byte First)
        response[respIdx++] = (value >> 8) & 0xFF;
        response[respIdx++] = value & 0xFF;
    }

    // Calculate CRC for Response
    uint16_t respCrc = calculateCRC(response, respIdx);
    response[respIdx++] = respCrc & 0xFF;        // CRC Lo
    response[respIdx++] = (respCrc >> 8) & 0xFF; // CRC Hi

    // Send
    write(clientSocket, response, respIdx);
    std::cout << "Sent response (" << respIdx << " bytes)" << std::endl;
}

void handleRequest(int clientSocket, int mySlaveId) {
    unsigned char buffer[BUFFER_SIZE];

    // Buffer to accumulate partial frames
    unsigned char frameBuffer[BUFFER_SIZE];
    int frameBufferLen = 0;

    while (true) {
        memset(buffer, 0, BUFFER_SIZE);
        int bytesRead = read(clientSocket, buffer, BUFFER_SIZE);

        if (bytesRead <= 0) {
            std::cout << "Client disconnected." << std::endl;
            break;
        }

        // --- DEBUG PRINT START ---
        std::cout << "Received " << bytesRead << " bytes: ";
        for(int i=0; i<bytesRead; i++) {
            printf("%02x ", buffer[i]);
        }
        std::cout << std::endl;
        // --- DEBUG PRINT END ---

        // Add received bytes to frame buffer
        for (int i = 0; i < bytesRead; i++) {
            frameBuffer[frameBufferLen++] = buffer[i];

            // Process complete frames in the buffer
            while (frameBufferLen >= 8) {
                // For Modbus RTU: addr(1) + func(1) + start_addr(2) + count(2) + crc(2) = 8 bytes minimum
                int functionCode = frameBuffer[1];

                // Only validate frame if it's a standard function code we expect
                if ((functionCode == 0x03 || functionCode == 0x04) && frameBufferLen >= 8) {
                    // Validate CRC first - for request, CRC covers first 6 bytes
                    // In Modbus RTU, CRC is transmitted as low byte first, then high byte
                    uint16_t receivedCRC = (frameBuffer[7] << 8) | frameBuffer[6]; // Low byte first, then high byte
                    uint16_t calculatedCRC = calculateCRC(frameBuffer, 6); // Calculate CRC over first 6 bytes

                    if (calculatedCRC == receivedCRC) {
                        // Valid request frame found
                        processFrame(frameBuffer, 8, mySlaveId, clientSocket); // Process complete 8-byte request
                        // Remove processed frame from buffer by shifting remaining data
                        memmove(frameBuffer, frameBuffer + 8, frameBufferLen - 8);
                        frameBufferLen -= 8;
                    } else {
                        // CRC error - this frame is invalid, try next possible frame
                        std::cout << "CRC Error in request. Calculated: " << std::hex << calculatedCRC
                                  << " Received: " << receivedCRC << std::dec << std::endl;
                        // Also print the raw bytes for debugging
                        std::cout << "Raw CRC bytes: " << std::hex << (int)frameBuffer[6] << " " << (int)frameBuffer[7] << std::dec << std::endl;
                        // Remove first byte and continue looking for valid frame
                        memmove(frameBuffer, frameBuffer + 1, frameBufferLen - 1);
                        frameBufferLen -= 1;
                    }
                } else {
                    // Not a recognizable frame start, advance buffer by 1 byte
                    memmove(frameBuffer, frameBuffer + 1, frameBufferLen - 1);
                    frameBufferLen -= 1;
                }
            }
        }
    }
    close(clientSocket);
}

// --- 3. Main Entry Point ---

int main(int argc, char *argv[]) {
    int slaveId = -1;

    // Parse Arguments
    for (int i = 1; i < argc; i++) {
        if (std::string(argv[i]) == "--slave_address" && i + 1 < argc) {
            slaveId = std::stoi(argv[i + 1]);
        }
    }

    if (slaveId == -1) {
        std::cerr << "Usage: ./system_monitor --slave_address <ID>" << std::endl;
        return 1;
    }

    std::cout << "Starting Modbus Slave (ID: " << slaveId << ") on Port " << PORT << "..." << std::endl;

    // Socket Setup
    int serverFd, newSocket;
    struct sockaddr_in address;
    int opt = 1;
    int addrlen = sizeof(address);

    if ((serverFd = socket(AF_INET, SOCK_STREAM, 0)) == 0) {
        perror("Socket failed");
        return 1;
    }

    // Reuse Address/Port
    if (setsockopt(serverFd, SOL_SOCKET, SO_REUSEADDR | SO_REUSEPORT, &opt, sizeof(opt))) {
        perror("setsockopt");
        return 1;
    }

    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(PORT);

    if (bind(serverFd, (struct sockaddr *)&address, sizeof(address)) < 0) {
        perror("Bind failed");
        return 1;
    }

    if (listen(serverFd, 3) < 0) {
        perror("Listen failed");
        return 1;
    }

    std::cout << "Listening..." << std::endl;

    while (true) {
        if ((newSocket = accept(serverFd, (struct sockaddr *)&address, (socklen_t*)&addrlen)) < 0) {
            perror("Accept failed");
            continue;
        }

        std::cout << "Connection accepted" << std::endl;
        handleRequest(newSocket, slaveId);
    }

    return 0;
}