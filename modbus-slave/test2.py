import socket
import struct

# Configuration
TCP_IP = '127.0.0.1'
TCP_PORT = 5000
BUFFER_SIZE = 1024

# CRC-16 Modbus calculation (matching the C++ implementation)
def calculate_crc(data):
    crc = 0xFFFF
    for byte in data:
        crc ^= byte
        for _ in range(8):
            if crc & 0x0001:
                crc >>= 1
                crc ^= 0xA001
            else:
                crc >>= 1
    return crc

# Build Modbus Frame: Slave 1, Read Holding (03), Addr 04 (CPU), Count 1
# Bytes: 01 03 00 04 00 01
frame = b'\x01\x03\x00\x04\x00\x01'

# Calculate and append CRC (Low byte first, then High byte)
crc = calculate_crc(frame)
crc_lo = crc & 0xFF
crc_hi = (crc >> 8) & 0xFF
packet = frame + bytes([crc_lo, crc_hi])

print(f"Calculated CRC: {crc:04x} (Lo: {crc_lo:02x}, Hi: {crc_hi:02x})")

print(f"Sending: {packet.hex()}")

try:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((TCP_IP, TCP_PORT))
    s.send(packet)
    
    # Wait for response
    data = s.recv(BUFFER_SIZE)
    s.close()
    
    print(f"Received raw: {data.hex()}")
     
    # Parse Response (assuming standard Modbus response)
    if len(data) >= 3:
        slave_id = data[0]
        func_code = data[1]
        byte_count = data[2]
        value_high = data[3]
        value_low = data[4]
        
         # Combine bytes to get the integer value
        metric_val = (value_high << 8) | value_low
        print(f"Slave ID: {slave_id}")
        print(f"Metric Value (Scaled x100): {metric_val}")
        print(f"Real Value: {metric_val / 100.0}%")        
except Exception as e:
    print(f"Error: {e}")