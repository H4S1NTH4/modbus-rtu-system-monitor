# CORS Configuration Documentation

## Overview

The application uses a **global CORS configuration** that applies to all controllers and endpoints. This eliminates the need to add `@CrossOrigin` annotations to individual controllers.

## Configuration File

**Location:** `src/main/java/com/hasintha/modbus/master/Config/CorsConfig.java`

### Implementation Details

Uses **WebMvcConfigurer interface** (Spring Boot 6.x recommended approach) instead of CorsConfigurationSource for better reliability and Spring Boot integration.

### What It Does

- ✅ Allows requests from configured origins (localhost:3000, localhost:8080, and 127.0.0.1 variants)
- ✅ Permits common HTTP methods (GET, POST, PUT, DELETE, PATCH, OPTIONS)
- ✅ Accepts all request headers
- ✅ Exposes response headers to clients
- ✅ Caches preflight requests for 1 hour to improve performance
- ✅ Works reliably with Spring Boot 6.x

## Allowed Methods

```java
GET, POST, PUT, DELETE, PATCH, OPTIONS
```

## Allowed Headers

### Request Headers
- `Content-Type` - Request body format
- `Authorization` - Authentication tokens
- `X-Requested-With` - AJAX request identification
- `Accept` - Expected response format
- `Origin` - Request origin
- `Access-Control-Request-Method` - Preflight method
- `Access-Control-Request-Headers` - Preflight headers

### Response Headers (Exposed)
- `Content-Type` - Response body format
- `Authorization` - Authentication tokens
- `X-Total-Count` - Total count for pagination
- `X-Page-Number` - Current page for pagination

## Configuration Details

The current implementation uses `WebMvcConfigurer` interface with `addCorsMappings()` method:

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:3000", "http://localhost:8080")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                .exposedHeaders("Content-Type", "Authorization", "X-Total-Count", "X-Page-Number")
                .allowCredentials(false)
                .maxAge(3600);
    }
}
```

### Key Settings:
- **allowedOrigins()** - Specific origins allowed (localhost:3000 for frontend, :8080 for backend)
- **allowedMethods()** - HTTP methods permitted
- **allowedHeaders()** - Request headers allowed (asterisk means all)
- **allowCredentials()** - Whether to allow credentials (false = no cookies/auth)
- **maxAge()** - Preflight cache duration in seconds (3600 = 1 hour)

## For Future Controllers

**No special configuration needed!** All future controllers will automatically inherit CORS settings:

```java
@RestController
@RequestMapping("/api/new-endpoint")
public class NewController {
    // CORS is automatically applied - no @CrossOrigin needed

    @PostMapping
    public ResponseEntity<?> createResource(@RequestBody Map<String, String> payload) {
        // Implementation
    }
}
```

## Production Considerations

### Restrict Origins
Replace localhost origins with your production domain:

```java
registry.addMapping("/**")
        .allowedOrigins("https://myapp.com", "https://www.myapp.com")
        // ... other settings
```

### Enable Credentials
If using authentication tokens in cookies:

```java
registry.addMapping("/**")
        .allowedOrigins("https://myapp.com")  // Must specify origins, can't use "*"
        .allowCredentials(true)
        // ... other settings
```

### Restrict Methods
Only allow needed methods:

```java
registry.addMapping("/**")
        .allowedMethods("GET", "POST", "PUT", "DELETE")
        // ... other settings
```

### Restrict Headers
Be more specific with allowed headers in production:

```java
registry.addMapping("/**")
        .allowedHeaders("Content-Type", "Authorization")
        // ... other settings
```

## Testing CORS

### From React Frontend
```javascript
// This will now work without CORS errors
fetch('http://localhost:8080/api/jobs', {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
})
```

### From curl
```bash
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS http://localhost:8080/api/jobs
```

## Benefits

1. **Scalability** - All controllers inherit CORS settings automatically
2. **Maintainability** - Single place to manage CORS configuration
3. **Performance** - Preflight caching reduces browser requests
4. **Flexibility** - Easy to modify for different environments
5. **Security** - Can restrict origins in production

## Related Files

- **Controllers:** `src/main/java/com/hasintha/modbus/master/Controller/`
- **Configuration:** `src/main/java/com/hasintha/modbus/master/Config/CorsConfig.java`

## Environment-Specific Configuration

For environment-specific CORS settings, add to `application.properties`:

```properties
# Development
app.cors.allowed-origins=http://localhost:3000,http://localhost:8080

# Production (set in environment variables)
app.cors.allowed-origins=${ALLOWED_ORIGINS:https://myapp.com}
```

Then modify `CorsConfig.java` to use these properties:

```java
@Value("${app.cors.allowed-origins}")
private String allowedOrigins;

// In corsConfigurationSource():
configuration.setAllowedOriginPatterns(
    Arrays.asList(allowedOrigins.split(","))
);
```

---

**Last Updated:** 2025-12-11
**Version:** 1.0
