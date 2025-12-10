import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, Check, AlertCircle, GraduationCap, KeyRound } from 'lucide-react';
import { supabase } from '../services/supabase';

interface ResetPasswordPageProps {
  onComplete: () => void;
}

const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onComplete }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Password Validation State
  const [pwdValidations, setPwdValidations] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    match: false
  });

  useEffect(() => {
    setPwdValidations({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      match: password.length > 0 && password === confirmPassword
    });
  }, [password, confirmPassword]);

  const isPasswordValid = pwdValidations.length && pwdValidations.uppercase && pwdValidations.lowercase && pwdValidations.number;
  const canSubmit = isPasswordValid && pwdValidations.match;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!canSubmit) {
      setError('Por favor verifica que la contraseña cumpla todos los requisitos y que ambas coincidan.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      setSuccess(true);
      
      // Redirect after success
      setTimeout(() => {
        onComplete();
      }, 2500);
    } catch (err: any) {
      console.error('Password update error:', err);
      if (err.message?.includes('same_password')) {
        setError('La nueva contraseña debe ser diferente a la anterior.');
      } else if (err.message?.includes('weak_password')) {
        setError('La contraseña es muy débil. Intenta con una más segura.');
      } else {
        setError(err.message || 'Ocurrió un error al actualizar la contraseña. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="beam w-[600px] h-[600px] bg-primary/20 -top-40 -left-40" />
          <div className="beam w-[500px] h-[500px] bg-secondary/15 -bottom-32 -right-32" />
          <div className="dot-grid" />
        </div>

        <div className="bg-card rounded-3xl shadow-[0_0_30px_rgba(0,0,0,0.6)] w-full max-w-sm overflow-hidden relative border border-muted p-8 text-center animate-in fade-in duration-500">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
            <Check size={32} className="text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">¡Contraseña actualizada!</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Tu contraseña ha sido cambiada exitosamente. Serás redirigido en unos segundos...
          </p>
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="beam w-[600px] h-[600px] bg-primary/20 -top-40 -left-40" />
        <div className="beam w-[500px] h-[500px] bg-secondary/15 -bottom-32 -right-32" />
        <div className="dot-grid" />
      </div>

      {/* Main Card */}
      <div className="bg-card rounded-3xl shadow-[0_0_30px_rgba(0,0,0,0.6)] w-full max-w-sm overflow-hidden relative border border-muted animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="p-6 pt-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-[0_0_15px_rgba(0,240,255,0.4)]">
              <KeyRound size={28} className="text-primary-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Nueva Contraseña</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Ingresa tu nueva contraseña para completar el restablecimiento
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive text-xs rounded-lg flex items-start gap-2 border border-destructive/20 animate-in fade-in duration-200">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground ml-1">Nueva contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="text-muted-foreground" size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 bg-background border border-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-foreground placeholder:text-muted-foreground/50"
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-foreground focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Password Strength Indicator */}
            <div className="space-y-2">
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isPasswordValid ? 'bg-green-500' : 'bg-primary'
                  }`}
                  style={{
                    width: `${
                      ((pwdValidations.length ? 1 : 0) +
                        (pwdValidations.uppercase ? 1 : 0) +
                        (pwdValidations.lowercase ? 1 : 0) +
                        (pwdValidations.number ? 1 : 0)) *
                      25
                    }%`
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                <span className={`flex items-center gap-1 transition-colors ${pwdValidations.length ? 'text-green-400 font-medium' : ''}`}>
                  {pwdValidations.length && <Check size={10} />} 8+ caracteres
                </span>
                <span className={`flex items-center gap-1 transition-colors ${pwdValidations.uppercase ? 'text-green-400 font-medium' : ''}`}>
                  {pwdValidations.uppercase && <Check size={10} />} Mayúscula
                </span>
                <span className={`flex items-center gap-1 transition-colors ${pwdValidations.lowercase ? 'text-green-400 font-medium' : ''}`}>
                  {pwdValidations.lowercase && <Check size={10} />} Minúscula
                </span>
                <span className={`flex items-center gap-1 transition-colors ${pwdValidations.number ? 'text-green-400 font-medium' : ''}`}>
                  {pwdValidations.number && <Check size={10} />} Número
                </span>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground ml-1">Confirmar contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="text-muted-foreground" size={18} />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-12 pr-12 py-3 bg-background border rounded-xl focus:outline-none focus:ring-2 transition-all text-sm text-foreground placeholder:text-muted-foreground/50 ${
                    confirmPassword.length > 0
                      ? pwdValidations.match
                        ? 'border-green-500/50 focus:ring-green-500/20 focus:border-green-500'
                        : 'border-destructive/50 focus:ring-destructive/20 focus:border-destructive'
                      : 'border-muted focus:ring-primary/20 focus:border-primary'
                  }`}
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center gap-2">
                  {confirmPassword.length > 0 && (
                    <span className={`transition-colors ${pwdValidations.match ? 'text-green-400' : 'text-destructive'}`}>
                      {pwdValidations.match ? <Check size={16} /> : <AlertCircle size={16} />}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-muted-foreground hover:text-foreground focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              {confirmPassword.length > 0 && !pwdValidations.match && (
                <p className="text-[10px] text-destructive ml-1 mt-1">Las contraseñas no coinciden</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="w-full py-3 bg-primary hover:bg-cyan-300 text-primary-foreground font-bold rounded-xl shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none mt-2"
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                'Actualizar Contraseña'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-muted/50 text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <GraduationCap size={16} className="text-primary" />
              <span className="text-xs font-medium">Inforario</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
