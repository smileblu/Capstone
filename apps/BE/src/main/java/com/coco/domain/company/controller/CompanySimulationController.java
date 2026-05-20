package com.coco.domain.company.controller;

import com.coco.domain.company.dto.SimulationResponse;
import com.coco.domain.company.service.CompanySimulationService;
import com.coco.global.error.code.GeneralSuccessCode;
import com.coco.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/company/simulation")
public class CompanySimulationController {

    private final CompanySimulationService simulationService;

    @GetMapping
    public ApiResponse<SimulationResponse> getSimulation() {
        return ApiResponse.onSuccess(GeneralSuccessCode.OK, simulationService.getSimulation());
    }
}
