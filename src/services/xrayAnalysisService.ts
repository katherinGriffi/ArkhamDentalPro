// src/services/xrayAnalysisService.ts

/**
 * Serviço para análise de radiografias usando IA
 */
export interface AnalysisResult {
  success: boolean;
  result?: {
    description?: string;
    segmentation_image?: string;
    message?: string;
    error?: string;
  };
  error?: string;
}

/**
 * Envia uma radiografia para análise com IA
 * @param file Arquivo de radiografia
 * @param analysisType Tipo de análise ('description' ou 'segmentation')
 * @returns Resultado da análise
 */
export const analyzeRadiography = async (
  file: File,
  analysisType: 'description' | 'segmentation' = 'description'
): Promise<AnalysisResult> => {
  try {
    // Converter o arquivo para base64
    const base64Image = await fileToBase64(file);
    
    // URL do backend Flask (ajuste conforme sua configuração)
    const apiUrl = process.env.REACT_APP_XRAY_ANALYSIS_API || 'http://localhost:5000/api/analyze-dental-xray';
    
    // Preparar os dados para a requisição
    const payload = {
      image: base64Image,
      analysis_type: analysisType
    };
    
    // Fazer a requisição para o backend
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload ),
    });
    
    // Verificar se a requisição foi bem-sucedida
    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status}`);
    }
    
    // Obter o resultado da análise
    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error('Erro ao analisar radiografia:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
};

/**
 * Função auxiliar para converter arquivo para base64
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};
