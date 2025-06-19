package com.tungtung.hello;

import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {

    private final JdbcTemplate jdbc;

    public HelloController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @RequestMapping("/hello")
    public String hello() {
        return "Hello World";
    }

    // Get all the accounts
    @GetMapping("/accounts")
    public List<Map<String, Object>> ListAccounts() {
        return jdbc.queryForList("SELECT * FROM account");
    }

}
