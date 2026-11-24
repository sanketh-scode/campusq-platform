
package com.campusq.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(
    name = "token_sequences",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_vendor_token_date",
            columnNames = {"vendor_id", "token_date"}
        )
    }
)
public class TokenSequence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @Column(name = "token_date", nullable = false)
    private LocalDate tokenDate;

    @Column(nullable = false)
    private Integer lastTokenNumber = 0;

    public TokenSequence() {
    }

    public Long getId() {
        return id;
    }

    public Vendor getVendor() {
        return vendor;
    }

    public void setVendor(Vendor vendor) {
        this.vendor = vendor;
    }

    public LocalDate getTokenDate() {
        return tokenDate;
    }

    public void setTokenDate(LocalDate tokenDate) {
        this.tokenDate = tokenDate;
    }

    public Integer getLastTokenNumber() {
        return lastTokenNumber;
    }

    public void setLastTokenNumber(Integer lastTokenNumber) {
        this.lastTokenNumber = lastTokenNumber;
    }
}
