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

// --- 2. Modbus Handling ---

void handleRequest(int clientSocket, int mySlaveId) {
    unsigned char buffer[BUFFER_SIZE];
    
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

        if (bytesRead < 8) continue;

        // 1. Validate Slave ID
        int receivedSlaveId = buffer[0];
        if (receivedSlaveId != mySlaveId) {
            std::cout << "Ignored ID: " << receivedSlaveId << std::endl;
            continue;
        }

        // 2. Validate CRC
        // Modbus RTU sends CRC as Low Byte then High Byte
        uint8_t crcLo = buffer[bytesRead - 2];
        uint8_t crcHi = buffer[bytesRead - 1];
        uint16_t receivedCRC = (crcHi << 8) | crcLo;

        uint16_t calculatedCRC = calculateCRC(buffer, bytesRead - 2);

        if (calculatedCRC != receivedCRC) {
            std::cout << "CRC Error. Calculated: " << std::hex << calculatedCRC
                      << " Received: " << receivedCRC << std::dec << std::endl;
            continue;
        }

        // 3. Parse Request
        int functionCode = buffer[1];
        uint16_t startAddr = (buffer[2] << 8) | buffer[3]; // Big Endian
        uint16_t count = (buffer[4] << 8) | buffer[5];     // Big Endian

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
            continue;
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
            else value = 0x0000; // Unknown register

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