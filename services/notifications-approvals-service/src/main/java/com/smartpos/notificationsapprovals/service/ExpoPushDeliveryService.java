package com.smartpos.notificationsapprovals.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.smartpos.notificationsapprovals.domain.DeviceRegistration;
import com.smartpos.notificationsapprovals.domain.DeviceRegistrationRepository;
import com.smartpos.notificationsapprovals.domain.Notification;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class ExpoPushDeliveryService {

    private static final Logger log = LoggerFactory.getLogger(ExpoPushDeliveryService.class);

    private final DeviceRegistrationRepository deviceRegistrationRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String pushUrl;

    public ExpoPushDeliveryService(DeviceRegistrationRepository deviceRegistrationRepository,
                                   RestTemplate restTemplate,
                                   ObjectMapper objectMapper,
                                   @Value("${expo.push-url}") String pushUrl) {
        this.deviceRegistrationRepository = deviceRegistrationRepository;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.pushUrl = pushUrl;
    }

    public void send(Notification notification) {
        List<DeviceRegistration> devices = deviceRegistrationRepository.findByUserId(notification.getRecipientUserId());
        if (devices.isEmpty()) {
            return;
        }
        try {
            ArrayNode messages = objectMapper.createArrayNode();
            for (DeviceRegistration device : devices) {
                ObjectNode msg = objectMapper.createObjectNode();
                msg.put("to", device.getExpoPushToken());
                msg.put("title", notification.getTitle());
                msg.put("body", notification.getBody());
                ObjectNode data = objectMapper.createObjectNode();
                data.put("notificationId", notification.getId().toString());
                data.put("kind", notification.getKind().name());
                data.put("deepLink", "smartpos://notifications/" + notification.getId());
                msg.set("data", data);
                messages.add(msg);
            }
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(messages.toString(), headers);
            String response = restTemplate.postForObject(pushUrl, entity, String.class);
            pruneInvalidTokens(response, devices);
        } catch (Exception e) {
            log.warn("Expo push failed: {}", e.getMessage());
        }
    }

    private void pruneInvalidTokens(String response, List<DeviceRegistration> devices) {
        if (response == null) {
            return;
        }
        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode data = root.get("data");
            if (data == null || !data.isArray()) {
                return;
            }
            for (int i = 0; i < data.size(); i++) {
                JsonNode item = data.get(i);
                if ("DeviceNotRegistered".equals(item.path("details").path("error").asText())) {
                    if (i < devices.size()) {
                        deviceRegistrationRepository.delete(devices.get(i));
                    }
                }
            }
        } catch (Exception ignored) {
            // best effort
        }
    }
}
