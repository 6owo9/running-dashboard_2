package com.running.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class GpxParserService {

    private static final List<String> ALLOWED_EXTENSIONS = List.of(".gpx", ".jpg", ".png");

    public ParsedGpxData parse(MultipartFile file) {
        String filename = file.getOriginalFilename();
        if (filename == null || filename.isBlank()) {
            throw new IllegalArgumentException("파일명이 없습니다.");
        }

        int dotIndex = filename.lastIndexOf(".");
        if (dotIndex == -1) {
            throw new IllegalArgumentException("확장자가 없는 파일입니다.");
        }
        String ext = filename.substring(dotIndex).toLowerCase();

        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new IllegalArgumentException("허용되지 않는 파일 형식입니다. (.gpx, .jpg, .png만 허용)");
        }

        if (!ext.equals(".gpx")) {
            return new ParsedGpxData(List.of(), null, 0.0, LocalDate.now());
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new IllegalArgumentException("파일을 읽을 수 없습니다.");
        }

        return parseGpx(bytes);
    }

    private ParsedGpxData parseGpx(byte[] bytes) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(false);
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document doc = builder.parse(new ByteArrayInputStream(bytes));

            NodeList trkpts = doc.getElementsByTagName("trkpt");
            if (trkpts.getLength() == 0) {
                throw new IllegalArgumentException("유효한 GPX 파일이 아닙니다. (경로 데이터 없음)");
            }

            List<double[]> coordinates = new ArrayList<>();
            Instant startTime = null;
            Instant endTime = null;

            for (int i = 0; i < trkpts.getLength(); i++) {
                Element trkpt = (Element) trkpts.item(i);
                double lat = Double.parseDouble(trkpt.getAttribute("lat"));
                double lon = Double.parseDouble(trkpt.getAttribute("lon"));

                // 유효하지 않은 좌표 필터링 (0,0 및 범위 초과)
                if ((lat == 0.0 && lon == 0.0) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
                    continue;
                }
                coordinates.add(new double[]{lat, lon});

                // 시간 파싱
                NodeList timeNodes = trkpt.getElementsByTagName("time");
                if (timeNodes.getLength() > 0) {
                    Instant t = Instant.parse(timeNodes.item(0).getTextContent().trim());
                    if (startTime == null) startTime = t;
                    endTime = t;
                }
            }

            if (coordinates.isEmpty()) {
                throw new IllegalArgumentException("유효한 좌표 데이터가 없습니다.");
            }

            Integer durationSeconds = null;
            if (startTime != null && endTime != null) {
                durationSeconds = (int) (endTime.getEpochSecond() - startTime.getEpochSecond());
            }

            LocalDate date = (startTime != null)
                    ? startTime.atZone(ZoneId.systemDefault()).toLocalDate()
                    : LocalDate.now();

            double distanceKm = calculateDistance(coordinates);

            return new ParsedGpxData(coordinates, durationSeconds, distanceKm, date);

        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("GPX 파싱 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    private double calculateDistance(List<double[]> coordinates) {
        double total = 0.0;
        for (int i = 1; i < coordinates.size(); i++) {
            total += haversine(coordinates.get(i - 1), coordinates.get(i));
        }
        return Math.round(total * 100.0) / 100.0;
    }

    private double haversine(double[] from, double[] to) {
        final double R = 6371.0;
        double dLat = Math.toRadians(to[0] - from[0]);
        double dLon = Math.toRadians(to[1] - from[1]);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(from[0])) * Math.cos(Math.toRadians(to[0]))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    public record ParsedGpxData(
            List<double[]> coordinates,
            Integer durationSeconds,
            double distanceKm,
            LocalDate date
    ) {}
}
