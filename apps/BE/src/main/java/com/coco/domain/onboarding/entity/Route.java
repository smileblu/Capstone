package com.coco.domain.onboarding.entity;

import com.coco.domain.user.entity.User;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor

public class Route {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long routeId;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private String routeName;
    private String originLabel;
    private String destLabel;
    private Double originLat;
    private Double originLng;
    private Double destLat;
    private Double destLng;

    private String defaultMode;

    /** 이동 거리(km). 온보딩 시 저장하거나, 없으면 좌표로 계산 가능. */
    private Double distanceKm;

    public Route(User user,
                 String routeName,
                 String originLabel,
                 String destLabel,
                 Double originLat,
                 Double originLng,
                 Double destLat,
                 Double destLng,
                 String defaultMode) {

        this.user = user;
        this.routeName = routeName;
        this.originLabel = originLabel;
        this.destLabel = destLabel;
        this.originLat = originLat;
        this.originLng = originLng;
        this.destLat = destLat;
        this.destLng = destLng;
        this.defaultMode = defaultMode;
    }
}