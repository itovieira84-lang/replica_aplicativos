export function hasPartnerContact(value?: string | null): boolean {
  return Boolean(value?.trim());
}

export function hasPartnerContacts(partner: { whatsapp?: string | null; email?: string | null; site?: string | null; instagram?: string | null }): boolean {
  return [partner.whatsapp, partner.email, partner.site, partner.instagram].some(hasPartnerContact);
}
