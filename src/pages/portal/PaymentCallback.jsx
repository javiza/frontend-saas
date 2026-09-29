import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';

// Ruta a la que WebpayReturnController (backend) redirige tras la
// inscripción de tarjeta en Transbank, ya con el token como query param
// (ver comentario en application.yaml / transbank.oneclick.response-url).
export default function PaymentCallback() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // processing | error | canceled
  const ranOnce = useRef(false);

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    const params = new URLSearchParams(window.location.search);
    const tokenWs = params.get('token_ws');

    if (params.get('canceled') === 'true' || !tokenWs) {
      setStatus('canceled');
      return;
    }

    if (!session) {
      // Se perdió la sesión (por ejemplo, se cerró y se volvió a abrir el
      // navegador en medio del flujo): no hay forma de saber a qué
      // empresa asociar la tarjeta, hay que loguearse de nuevo.
      setStatus('error');
      return;
    }

    api
      .finishPaymentInscription(session.token, session.companyId, tokenWs)
      .then(() => navigate('/portal/catalogo?payment=success', { replace: true }))
      .catch(() => setStatus('error'));
  }, [session, navigate]);

  return (
    <div className="app-shell" style={{ alignItems: 'center', justifyContent: 'center', display: 'flex' }}>
      <div className="card" style={{ maxWidth: 420, textAlign: 'center' }}>
        {status === 'processing' && <p>Confirmando tu tarjeta con Transbank…</p>}
        {status === 'canceled' && (
          <>
            <p>Cancelaste el registro de la tarjeta. No se guardó ningún dato.</p>
            <button className="btn-primary" onClick={() => navigate('/portal/catalogo')}>
              Volver al catálogo
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <p>No pudimos confirmar la tarjeta. Podés intentarlo de nuevo.</p>
            <button
              className="btn-primary"
              onClick={() => navigate(session ? '/portal/catalogo?payment=error' : '/login')}
            >
              {session ? 'Volver al catálogo' : 'Iniciar sesión'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
