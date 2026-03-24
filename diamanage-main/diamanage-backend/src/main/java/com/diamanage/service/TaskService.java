package com.diamanage.service;

import com.diamanage.entity.Task;
import com.diamanage.entity.User;
import com.diamanage.repository.TaskRepository;
import com.diamanage.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TaskService {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    public Task addTask(Long userId, String description, boolean isMandatory, String createdByRole) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return null;
        }

        Task task = new Task();
        task.setUserId(userId);
        task.setDescription(description);
        task.setMandatory(isMandatory);
        task.setCreatedByRole(createdByRole);
        task.setCompleted(false);
        task.setRecordTime(LocalDateTime.now());

        return taskRepository.save(task);
    }

    public List<Task> getTasksByUser(Long userId) {
        return taskRepository.findByUserId(userId);
    }

    public Task toggleTask(Long taskId) {
        Task task = taskRepository.findById(taskId).orElse(null);
        if (task == null) {
            return null;
        }

        task.setCompleted(!task.getCompleted());
        return taskRepository.save(task);
    }

    public boolean deleteTask(Long taskId) {
        Task task = taskRepository.findById(taskId).orElse(null);
        if (task == null) {
            return false;
        }

        taskRepository.delete(task);
        return true;
    }
}