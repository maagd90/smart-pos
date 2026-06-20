/**
 * Checks the API gateway health endpoint.
 *
 * @returns the health status string from the gateway, or "DOWN" on failure
 */
export async function checkGatewayHealth(): Promise<string> {
  try {
    const response = await fetch('/actuator/health');
    if (!response.ok) {
      return 'DOWN';
    }
    const data = await response.json();
    return data.status ?? 'UNKNOWN';
  } catch {
    return 'DOWN';
  }
}
