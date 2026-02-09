import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./PaymentPage.css";
import wompiLogo from "../../img/Wompi_LogoPrincipal.svg";

// Helper function for formatting numbers with dots
const formatIntegerWithDots = (raw) => {
  const parseNumber = (val) => {
    if (typeof val === "number") return val;
    if (val === null || val === undefined || val === "") return 0;
    const cleaned = String(val)
      .replace(/\s/g, "")
      .replace(/\$/g, "")
      .replace(/\./g, "")
      .replace(/,/g, ".");
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  };

  const n = typeof raw === "number" ? raw : parseNumber(raw);
  if (isNaN(n)) return raw ?? "";
  const rounded = Math.round(n);
  const sign = rounded < 0 ? "-" : "";
  const abs = Math.abs(rounded).toString();
  return sign + abs.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const PAYMENT_REASONS = [
  "Retención",
  "Descuento - Impulso",
  "Pronto pago",
  "Flete",
];

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { Documento, Nombre_Cliente, Cliente, Saldo, fromDashboard } =
    location.state || {};

  const [nombrePagador] = useState(Nombre_Cliente || ""); // Setter removido
  const [nitPagador] = useState(Cliente || ""); // Setter removido
  const [paymentOption, setPaymentOption] = useState("total");
  const [customAmount, setCustomAmount] = useState("");
  const [selectedMotive, setSelectedMotive] = useState(""); 
  const [isProcessing, setIsProcessing] = useState(false);

  const apiUrl = process.env.REACT_APP_API_URL || "https://cartera-betsupplier-backend.onrender.com";

  const saldoTotal = typeof Saldo === "number" ? Saldo : 0;

  const montoAPagar = useMemo(() => {
    switch (paymentOption) {
      case "total":
        return Math.max(0, saldoTotal);
      case "abono":
      case "otro":
        const parsedAmount = parseFloat(
          customAmount.replace(/[^\d.,]/g, "").replace(/,/g, "."),
        );
        return isNaN(parsedAmount) || parsedAmount < 0
          ? 0
          : Math.min(parsedAmount, saldoTotal);
      default:
        return 0;
    }
  }, [paymentOption, customAmount, saldoTotal]);

  const iniciarPago = useCallback(
    async (gateway) => {
      if (montoAPagar <= 0) {
        alert("El monto a pagar debe ser mayor a cero.");
        return;
      }

      if (paymentOption === "otro" && !selectedMotive) {
        alert("Por favor, selecciona un motivo para el pago.");
        return;
      }

      if (gateway === "Wompi") {
        setIsProcessing(true);

        try {
          const amountInCents = Math.round(montoAPagar * 100);
          
          // Generación de referencia para incluir tipo y motivo del pago.
          // Formato: FAC-{Documento}-{timestamp}-{paymentOption}-{motivo}
          const motivoLimpio = (selectedMotive || "").replace(/\s+/g, '_');
          let reference = `FAC-${Documento}-${Date.now()}-${paymentOption}`;
          if (paymentOption === "otro" && motivoLimpio) {
            reference += `-${motivoLimpio}`;
          }

          // La llamada a /pagos/save-intent ha sido eliminada.

          const redirectUrl = `${apiUrl}/pagos/response`;

          const response = await fetch(`${apiUrl}/pagos/wompi/signature`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reference,
              amountInCents,
              currency: "COP",
              redirectUrl,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Error al obtener firma");
          }

          const { signature, publicKey } = await response.json();

          const params = new URLSearchParams({
            mode: "widget",
            "public-key": publicKey,
            currency: "COP",
            "amount-in-cents": amountInCents.toString(),
            reference: reference,
            "redirect-url": redirectUrl,
            "signature:integrity": signature,
          });

          window.location.href = `https://checkout.wompi.co/p/?${params.toString()}`;

        } catch (error) {
          setIsProcessing(false);
          console.error("Error Wompi:", error);
          alert("Error al iniciar el pago. Intenta de nuevo.");
        }
      }
    },
    [montoAPagar, Documento, paymentOption, selectedMotive, apiUrl]
  );

  useEffect(() => {
    if (!fromDashboard || !Documento || isNaN(saldoTotal) || saldoTotal === 0) {
      alert("Error: No se cargaron los detalles de la factura.");
      navigate("/dashboard", { replace: true });
    }
  }, [fromDashboard, Documento, saldoTotal, navigate]);

  if (!fromDashboard || !Documento || isNaN(saldoTotal) || saldoTotal === 0)
    return null;

  return (
    <div className="payment-page-container">
      <div className="payment-box">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Regresar
        </button>

        <div className="payment-header">
          <h2>Confirmación de Pago</h2>
          <div className="payment-header-subtitle">
            <span className="payment-subtitle-label">Factura No.</span>
            <span className="payment-documento">{Documento}</span>
          </div>
        </div>

        <div className="detalle-pago">
          <div className="form-group">
            <label>Nombre del Pagador</label>
            <div className="payment-input payment-display">{nombrePagador}</div>
          </div>
          <div className="form-group">
            <label>NIT / Cédula</label>
            <div className="payment-input payment-display">{nitPagador}</div>
          </div>
        </div>

        <div className="monto-section">
          <span className="monto-section-title">Selecciona el monto a pagar</span>
          <div className="monto-options">
            <div className={`monto-option ${paymentOption === "total" ? "selected" : ""}`} onClick={() => setPaymentOption("total")}>
              <span className="monto-option-text">Pagar Total</span>
              <span className="monto-option-amount">${formatIntegerWithDots(saldoTotal)}</span>
            </div>
            <div className={`monto-option ${paymentOption === "abono" ? "selected" : ""}`} onClick={() => setPaymentOption("abono")}>
              <span className="monto-option-text">Abonar</span>
              <span className="monto-option-hint">Ingresar monto</span>
            </div>
            <div className={`monto-option ${paymentOption === "otro" ? "selected" : ""}`} onClick={() => setPaymentOption("otro")}>
              <span className="monto-option-text">Otro Monto</span>
              <span className="monto-option-hint">Definir valor</span>
            </div>
          </div>
        </div>

        {(paymentOption === "abono" || paymentOption === "otro") && (
          <div className="custom-amount-container">
            <div className="form-group">
              <label>Monto a pagar</label>
              <div className="input-icon-wrapper">
                <input
                  type="text"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value.replace(/[^\d.,]/g, ""))}
                  className="payment-input input-with-icon"
                  placeholder="0"
                />
                <span className="input-currency-symbol">$</span>
              </div>
            </div>
          </div>
        )}

        {paymentOption === "otro" && (
          <div className="motive-section">
            <label className="motive-section-title">Motivo del Pago</label>
            <div className="select-wrapper">
              <select
                value={selectedMotive}
                onChange={(e) => setSelectedMotive(e.target.value)}
                className="payment-input select-custom"
              >
                <option value="" disabled>Seleccione un motivo...</option>
                {PAYMENT_REASONS.map((reason) => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
              <span className="select-arrow">▼</span>
            </div>
          </div>
        )}

        <div className="payment-total">
          <span className="payment-total-label">Total a Pagar</span>
          <span className="payment-total-amount">${formatIntegerWithDots(montoAPagar)}</span>
        </div>

        <div className="payment-options">
          <button className={`payment-button wompi ${isProcessing ? "loading" : ""}`} disabled={isProcessing} onClick={() => iniciarPago("Wompi")}>
            {isProcessing ? <span className="button-spinner" /> : <>Pagar con <img src={wompiLogo} alt="Wompi" className="wompi-logo" /></>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;