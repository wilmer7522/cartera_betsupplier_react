import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './PaymentResponse.css';

// --- Iconos SVG para un mejor feedback visual ---
const ApprovedIcon = () => (
  <svg className="response-icon approved" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg>
);
const DeclinedIcon = () => (
  <svg className="response-icon declined" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" /></svg>
);
const PendingIcon = () => (
  <svg className="response-icon pending" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
);
const Spinner = () => <div className="spinner"></div>;


const PaymentResponse = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [paymentDetails, setPaymentDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Lee los parámetros principales de la URL
  const status = searchParams.get('status');
  const tx_id = searchParams.get('tx_id');
  const messageParam = searchParams.get('message');

  useEffect(() => {
    // Solo intentamos buscar detalles si el estado es exitoso y tenemos un ID.
    if ((status === 'APPROVED' || status === 'DUPLICATED') && tx_id) {
      const fetchPaymentDetails = async () => {
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL}/pagos/estado/${tx_id}`);
          if (!response.ok) {
            throw new Error('No se pudieron cargar los detalles del pago.');
          }
          const data = await response.json();
          setPaymentDetails(data.pago);
        } catch (err) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchPaymentDetails();
    } else {
      setIsLoading(false);
    }
  }, [status, tx_id]);

  const getResponseDetails = () => {
    switch (status) {
      case 'APPROVED':
        return { title: '¡Pago Aprobado!', message: 'Tu pago ha sido procesado y registrado exitosamente.', icon: <ApprovedIcon />, cardClass: 'approved' };
      case 'DUPLICATED':
         return { title: 'Pago ya Procesado', message: 'Esta transacción ya había sido registrada anteriormente.', icon: <ApprovedIcon />, cardClass: 'approved' };
      case 'DECLINED':
      case 'REJECTED':
        return { title: 'Pago Rechazado', message: 'No se pudo completar el pago. Por favor, intenta de nuevo o contacta a tu banco.', icon: <DeclinedIcon />, cardClass: 'declined' };
      case 'PENDING':
        return { title: 'Pago Pendiente', message: 'Tu pago está pendiente de confirmación.', icon: <PendingIcon />, cardClass: 'pending' };
      default:
        return { title: 'Error en la Transacción', message: messageParam || 'Ocurrió un error inesperado.', icon: <DeclinedIcon />, cardClass: 'declined' };
    }
  };

  const { title, message, icon, cardClass } = getResponseDetails();

  const formatCurrency = (value) => {
    if (typeof value !== 'number') return 'N/A';
    return value.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
  };
  
  const formatDate = (dateString) => {
  if (!dateString) return 'N/A';

  // Diccionario de traducción simple
  const meses = {
    'January': 'Enero', 
    'February': 'Febrero', 
    'March': 'Marzo', 
    'April': 'Abril', 
    'May': 'Mayo', 
    'June': 'Junio', 
    'July': 'Julio', 
    'August': 'Agosto', 
    'September': 'Septiembre', 
    'October': 'Octubre', 
    'November': 'Noviembre', 
    'December': 'Diciembre'
  };

  // Reemplazamos la palabra en inglés por español si existe en el string
  let fechaTraducida = dateString;
  Object.keys(meses).forEach(mes => {
    if (fechaTraducida.includes(mes)) {
      fechaTraducida = fechaTraducida.replace(mes, meses[mes]);
    }
  });

  return fechaTraducida;
};

  return (
    <div className="payment-response-container">
      <div className={`response-card ${cardClass}`}>
        {icon}
        <h2>{title}</h2>
        <p className="status-message">{message}</p>
        
        {isLoading ? <Spinner /> : (
          <>
            {error && <p className="error-message">{error}</p>}
            
            {paymentDetails && (
              <div className="payment-details">
                <div className="detail-item"><span>No. Factura:</span> <strong>{paymentDetails.documento_original}</strong></div>
                <div className="detail-item"><span>Monto Pagado:</span> <strong>{formatCurrency(paymentDetails.monto)}</strong></div>
                <div className="detail-item"><span>Tipo de Pago:</span> <strong>{paymentDetails.payment_type || 'N/A'}</strong></div>
                {paymentDetails.payment_motive && <div className="detail-item"><span>Motivo:</span> <strong>{paymentDetails.payment_motive}</strong></div>}
                <div className="detail-item"><span>Nombre Cliente:</span> <strong>{paymentDetails.nombre_cliente_factura}</strong></div>
                <div className="detail-item"><span>NIT:</span> <strong>{paymentDetails.nit}</strong></div>
                <div className="detail-item"><span>Saldo Original:</span> <strong>{formatCurrency(paymentDetails.saldo_original_factura)}</strong></div>
                <div className="detail-item"><span>Nuevo Saldo:</span> <strong>{formatCurrency(paymentDetails.nuevo_saldo_factura)}</strong></div>
                <div className="detail-item"><span>Fecha de Pago:</span> <strong>{formatDate(paymentDetails.fecha)}</strong></div>
                <div className="detail-item"><span>ID Transacción:</span> <strong>{tx_id}</strong></div>
              </div>
            )}
          </>
        )}

        <button onClick={() => navigate('/dashboard')} className="back-btn">
          Volver al Dashboard
        </button>
      </div>
    </div>
  );
};

export default PaymentResponse;

