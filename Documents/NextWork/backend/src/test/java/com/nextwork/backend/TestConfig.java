package com.nextwork.backend;

import com.nextwork.Service.EmailService;
import com.nextwork.Service.GoogleCalendarService;
import com.nextwork.Utilities.QrUtil;
import org.mockito.Mockito;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

@TestConfiguration
public class TestConfig {

    @Bean
    @Primary
    public EmailService emailService() {
        return Mockito.mock(EmailService.class);
    }

    @Bean
    @Primary
    public GoogleCalendarService googleCalendarService() {
        return Mockito.mock(GoogleCalendarService.class);
    }

    @Bean
    @Primary
    public QrUtil qrUtil() {
        return Mockito.mock(QrUtil.class);
    }
}
