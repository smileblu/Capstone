package com.coco.domain.ai.infrastructure;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

/**
 * apps/BE/ai/ai_cli.py 를 stdin JSON -> stdout JSON 방식으로 호출하는 클라이언트.
 */
@Component
@RequiredArgsConstructor
public class PythonAiCliClient {

    private final ObjectMapper objectMapper;

    public JsonNode runTask(String task, Map<String, Object> params) {
        try {
            String scriptPath = resolveScriptPath();
            ProcessBuilder pb = new ProcessBuilder("python3", scriptPath);
            pb.redirectErrorStream(false);

            Process process = pb.start();

            // stdin으로 payload 전달
            Map<String, Object> payload = new HashMap<>();
            payload.put("task", task);
            payload.put("params", params);

            try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(process.getOutputStream(), StandardCharsets.UTF_8))) {
                writer.write(objectMapper.writeValueAsString(payload));
                writer.flush();
            }

            // stdout/stderr 수집
            String stdout;
            String stderr;
            try (InputStream stdoutStream = process.getInputStream();
                 InputStream stderrStream = process.getErrorStream()) {
                stdout = readAll(stdoutStream);
                stderr = readAll(stderrStream);
            }

            int exitCode = process.waitFor();
            if (exitCode != 0) {
                throw new RuntimeException("Python AI failed. exitCode=" + exitCode + ", stderr=" + stderr);
            }

            return objectMapper.readTree(stdout);
        } catch (Exception e) {
            throw new RuntimeException("Python AI invocation failed: " + e.getMessage(), e);
        }
    }

    private String resolveScriptPath() {
        String env = System.getenv("CARBON_AI_CLI_PATH");
        if (env != null && !env.isBlank()) {
            return env;
        }

        // Spring 실행을 apps/BE에서 돌린다고 가정하는 기본 경로
        Path defaultPath = Path.of(System.getProperty("user.dir"), "ai", "ai_cli.py");
        return defaultPath.toString();
    }

    private static String readAll(InputStream is) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) {
                sb.append(line);
            }
        }
        return sb.toString();
    }
}

