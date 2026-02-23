package com.coco.domain.onboarding.entity;

import com.coco.domain.user.entity.User;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor

public class UserProfilePersonal {
    @Id
    private Long userId;

    @MapsId
    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    private Boolean hasFrequentRoute;

    private String mainTransport;
    private String dailyTravelTimeBand;
    private Integer electricityBill;public UserProfilePersonal(User user,
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