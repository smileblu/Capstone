package com.coco.domain.onboarding.entity;

import com.coco.domain.user.entity.User;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Persistable;

@Entity
@Getter
@NoArgsConstructor

public class UserProfilePersonal implements Persistable<Long> {
    @Id
    private Long userId;

    @MapsId
    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    private Boolean hasFrequentRoute;

    private String mainTransport;
    private String dailyTravelTimeBand;
    private Integer electricityBill;

    @Transient
    private boolean newEntity = true;

    @PostLoad
    @PostPersist
    void markNotNew() { this.newEntity = false; }

    @Override
    public Long getId() { return userId; }

    @Override
    public boolean isNew() { return newEntity; }public UserProfilePersonal(User user,
                                                               Boolean hasFrequentRoute,
                                                               String mainTransport,
                                                               String dailyTravelTimeBand,
                                                               Integer electricityBill) {

        this.user = user;
        this.userId = user.getUserId();
        this.hasFrequentRoute = hasFrequentRoute;
        this.mainTransport = mainTransport;
        this.dailyTravelTimeBand = dailyTravelTimeBand;
        this.electricityBill = electricityBill;


    }
    public void update(Boolean hasFrequentRoute,
                       String mainTransport,
                       String dailyTravelTimeBand,
                       Integer electricityBill) {

        this.hasFrequentRoute = hasFrequentRoute;
        this.mainTransport = mainTransport;
        this.dailyTravelTimeBand = dailyTravelTimeBand;
        this.electricityBill = electricityBill;
    }

}