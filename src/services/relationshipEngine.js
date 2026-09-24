
export function buildMedicalAnalysisLink({ clientId = '', policyId = '' } = {}) {
  const params = new URLSearchParams()
  if (clientId) params.set('clientId', clientId)
  if (policyId) params.set('policyId', policyId)
  const query = params.toString()
  return '/medical-analysis' + (query ? '?' + query : '')
}

export function buildClient360Link(clientId) {
  return clientId ? '/clients?selected=' + encodeURIComponent(clientId) : '/clients'
}

export function buildPolicyLink(policyId) {
  return policyId ? '/policies?selected=' + encodeURIComponent(policyId) : '/policies'
}
