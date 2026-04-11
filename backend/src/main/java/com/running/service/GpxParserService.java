package com.running.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.w3c.dom.Document;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilderFactory;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class GpxParserService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * GPX InputStream에서 좌표 배열([[lat, lng], ...])을 파싱해 JSON 문자열로 반환
     * trkpt가 없으면 IllegalArgumentException
     */
    public String parseCoordinates(InputStream gpxStream) {
        try {
            Document doc = DocumentBuilderFactory.newInstance()
                    .newDocumentBuilder()
                    .parse(gpxStream);

            NodeList trkpts = doc.getElementsByTagName("trkpt");
            if (trkpts.getLength() == 0) {
                throw new IllegalArgumentException("GPX 파일에 경로 데이터(trkpt)가 없습니다.");
            }

            List<double[]> coordinates = new ArrayList<>();
            for (int i = 0; i < trkpts.getLength(); i++) {
                var node = trkpts.item(i);
                double lat = Double.parseDouble(node.getAttributes().getNamedItem("lat").getNodeValue());
                double lng = Double.parseDouble(node.getAttributes().getNamedItem("lon").getNodeValue());
                coordinates.add(new double[]{lat, lng});
            }

            return objectMapper.writeValueAsString(coordinates);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("GPX 파일 파싱에 실패했습니다: " + e.getMessage());
        }
    }

    /**
     * GPX InputStream에서 첫 번째 time 태그를 파싱해 LocalDate 반환
     * time 태그 없으면 null 반환
     */
    public LocalDate parseRunDate(InputStream gpxStream) {
        try {
            Document doc = DocumentBuilderFactory.newInstance()
                    .newDocumentBuilder()
                    .parse(gpxStream);

            NodeList times = doc.getElementsByTagName("time");
            if (times.getLength() == 0) return null;

            // ISO 8601 형식: "2024-01-15T08:30:00Z" → 앞 10자만 사용
            String timeStr = times.item(0).getTextContent().trim();
            if (timeStr.length() < 10) return null;
            return LocalDate.parse(timeStr.substring(0, 10));
        } catch (Exception e) {
            // 날짜 파싱 실패는 무시하고 null 반환 (runDate는 선택 항목)
            return null;
        }
    }

    /**
     * 좌표 JSON 문자열을 List<double[]>으로 변환
     */
    public List<double[]> parseCoordinateJson(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, double[].class));
        } catch (Exception e) {
            throw new IllegalArgumentException("좌표 데이터 파싱에 실패했습니다: " + e.getMessage());
        }
    }

    /**
     * 좌표 목록에서 Haversine 공식으로 총 거리(km) 계산
     */
    public double calculateDistanceKm(List<double[]> coords) {
        if (coords == null || coords.size() < 2) return 0.0;
        double total = 0.0;
        for (int i = 1; i < coords.size(); i++) {
            total += haversine(coords.get(i - 1)[0], coords.get(i - 1)[1],
                               coords.get(i)[0],     coords.get(i)[1]);
        }
        return Math.round(total * 1000.0) / 1000.0;
    }

    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                 * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
