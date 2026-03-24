package com.diamanage.controller;

import com.diamanage.entity.Task;
import com.diamanage.service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/task")
public class TaskController {

    @Autowired
    private TaskService taskService;

    @PostMapping("/add")
    public Map<String, Object> addTask(@RequestBody Map<String, Object> request) {
        Long userId = Long.valueOf(request.get("userId").toString());
        String description = request.get("description").toString().trim();
        boolean mandatory = Boolean.parseBoolean(request.get("mandatory").toString());
        String createdByRole = request.get("createdByRole").toString();

        Map<String, Object> response = new HashMap<>();

        if (description.isEmpty()) {
            response.put("success", false);
            response.put("message", "Task description is required");
            return response;
        }

        Task task = taskService.addTask(userId, description, mandatory, createdByRole);

        if (task != null) {
            response.put("success", true);
            response.put("task", task);
        } else {
            response.put("success", false);
            response.put("message", "User not found");
        }

        return response;
    }

    @GetMapping("/user/{userId}")
    public List<Task> getTasksByUser(@PathVariable Long userId) {
        return taskService.getTasksByUser(userId);
    }

    @PatchMapping("/toggle/{taskId}")
    public Map<String, Object> toggleTask(@PathVariable Long taskId) {
        Map<String, Object> response = new HashMap<>();
        Task task = taskService.toggleTask(taskId);

        if (task != null) {
            response.put("success", true);
            response.put("task", task);
        } else {
            response.put("success", false);
            response.put("message", "Task not found");
        }

        return response;
    }

    @DeleteMapping("/{taskId}")
    public Map<String, Object> deleteTask(@PathVariable Long taskId) {
        Map<String, Object> response = new HashMap<>();
        boolean deleted = taskService.deleteTask(taskId);

        response.put("success", deleted);
        if (!deleted) {
            response.put("message", "Task not found");
        }

        return response;
    }
}