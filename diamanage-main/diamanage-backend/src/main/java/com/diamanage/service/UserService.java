package com.diamanage.service;

import com.diamanage.entity.User;
import com.diamanage.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;    //used to salt and hash passwords. Spring security class

    public User register(String email, String password, String name, String role) {
        if (userRepository.findByEmail(email) != null) {
            return null;
        }
        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));     //salt and hash password on registration
        user.setName(name);
        user.setRole(role);
        return userRepository.save(user);
    }

    public User login(String email, String password) {
        User user = userRepository.findByEmail(email);
        if (user != null && passwordEncoder.matches(password, user.getPassword())) {    //check password against hashed password in database
            return user;
        }
        return null;
    }

    public User getUserById(Long id) {
        return userRepository.findById(id).orElse(null);
    }
}
