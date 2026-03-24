package com.diamanage.controller;

import com.diamanage.entity.DoctorPatient;
import com.diamanage.entity.User;
import com.diamanage.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");
        String name = request.get("name");
        String role = request.get("role");

        Map<String, Object> response = new HashMap<>();
        User user = userService.register(email, password, name, role);

        if (user != null) {
            response.put("success", true);
            response.put("userId", user.getId());
            response.put("role", user.getRole());
        } else {
            response.put("success", false);
            response.put("message", "Email already exists");
        }

        return response;
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        Map<String, Object> response = new HashMap<>();
        User user = userService.login(email, password);

        if (user != null) {
            response.put("success", true);
            response.put("userId", user.getId());
            response.put("name", user.getName());
            response.put("role", user.getRole());
        } else {
            response.put("success", false);
            response.put("message", "Invalid email or password");
        }
        return response;
    }

    @GetMapping("/{id}")
    public Map<String, Object> getUserById(@PathVariable Long id) {

        Map<String, Object> response = new HashMap<>();

        User user = userService.getUserById(id);

        if (user != null) {
            response.put("success", true);
            response.put("userId", user.getId());
            response.put("name", user.getName());
            response.put("email", user.getEmail());
            response.put("role", user.getRole());
        } else {
            response.put("success", false);
            response.put("message", "User not found");
        }
        return response;
    }
}
