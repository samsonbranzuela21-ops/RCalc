def get_solution_steps(Mu, b, d, fc, fy, bar_diameter, result: FlexuralBeamResult) -> list[dict]:
    """Returns ordered step-by-step worked solution, mirroring the TS version."""
    m = fy / (0.85 * fc)
    Mu_Nmm = Mu * 1e6

    steps = [
        {"label": "1. Convert Mu to N·mm", "formula": "Mu = Mu(kN·m) × 10^6",
         "substitution": f"Mu = {Mu} × 10^6", "result": f"Mu = {Mu_Nmm:,.0f} N·mm"},

        {"label": "2. Required nominal resistance, Rn", "formula": "Rn = Mu / (φ·b·d²)",
         "substitution": f"Rn = {Mu_Nmm:,.0f} / (0.90 × {b} × {d}²)",
         "result": f"Rn = {result.Rn:.3f} MPa"},

        {"label": "3. Steel ratio coefficient, m", "formula": "m = fy / (0.85·f'c)",
         "substitution": f"m = {fy} / (0.85 × {fc})", "result": f"m = {m:.4f}"},

        {"label": "4. β1 factor",
         "formula": "β1 = 0.85 (f'c ≤ 28 MPa)" if fc <= 28 else "β1 = 0.85 − 0.05·[(f'c−28)/7]",
         "substitution": "—" if fc <= 28 else f"β1 = 0.85 − 0.05×[({fc}-28)/7]",
         "result": f"β1 = {result.beta1:.3f}"},

        {"label": "5. Required steel ratio, ρ", "formula": "ρ = (1/m)·[1 − √(1 − 2mRn/fy)]",
         "substitution": f"ρ = (1/{m:.4f})·[1 − √(1 − 2×{m:.4f}×{result.Rn:.3f}/{fy})]",
         "result": "No real solution — section inadequate" if math.isnan(result.rho_required)
                   else f"ρ = {result.rho_required:.5f}"},

        {"label": "6. ρmin check", "formula": "ρmin = max(1.4/fy, √f'c / 4fy)",
         "substitution": f"ρmin = max(1.4/{fy}, √{fc}/(4×{fy}))",
         "result": f"ρmin = {result.rho_min:.5f}"},

        {"label": "7. ρmax check (0.75ρb)",
         "formula": "ρb = (0.85·f'c·β1/fy)·[600/(600+fy)] ; ρmax = 0.75ρb",
         "substitution": f"ρb = (0.85×{fc}×{result.beta1:.3f}/{fy})×[600/(600+{fy})]",
         "result": f"ρmax = {result.rho_max:.5f}"},

        {"label": "8. Governing case", "formula": "Compare ρ to ρmin and ρmax",
         "substitution": f"ρ vs. ρmin={result.rho_min:.5f}, ρmax={result.rho_max:.5f}",
         "result": result.governing_case.upper()},

        {"label": "9. Required steel area, As", "formula": "As = ρ·b·d",
         "substitution": f"As = ρ_governing × {b} × {d}",
         "result": "N/A" if math.isnan(result.As_final) else f"As = {result.As_final:.0f} mm²"},

        {"label": "10. Number of bars", "formula": "n = As / Ab, Ab = π·db²/4",
         "substitution": f"n = {result.As_final:.0f} / (π×{bar_diameter}²/4)" if not math.isnan(result.As_final) else "N/A",
         "result": f"n = {bars_required(result.As_final, bar_diameter)} bars × {bar_diameter}mm"
                   if not math.isnan(result.As_final) else "N/A"},
    ]
    return steps