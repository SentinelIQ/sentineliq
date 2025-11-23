import { useTranslation as useI18NextTranslation } from 'react-i18next';

/**
 * Hook personalizado para internacionalização
 * Facilita o uso de traduções em toda a aplicação
 * 
 * @example
 * const { t } = useTranslation('common');
 * return <h1>{t('app.name')}</h1>;
 * 
 * @example Com interpolação
 * const { t } = useTranslation('dashboard');
 * return <p>{t('welcome', { name: user.name })}</p>;
 * 
 * @example Com múltiplos namespaces
 * const { t } = useTranslation(['common', 'auth']);
 * return <>{t('common:actions.save')} - {t('auth:login.title')}</>
 */
export function useTranslation(ns?: string | string[]) {
  return useI18NextTranslation(ns as any);
}

/**
 * Hook para gerenciar o idioma atual
 * 
 * @example
 * const { currentLanguage, changeLanguage } = useLanguage();
 * 
 * return (
 *   <select value={currentLanguage} onChange={(e) => changeLanguage(e.target.value)}>
 *     <option value="en">English</option>
 *     <option value="pt">Português</option>
 *   </select>
 * );
 */
export function useLanguage() {
  const { i18n } = useI18NextTranslation();

  return {
    currentLanguage: i18n.language,
    changeLanguage: (lang: string) => i18n.changeLanguage(lang),
    supportedLanguages: ['en', 'pt'] as const,
  };
}
