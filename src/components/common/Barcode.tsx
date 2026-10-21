import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeProps {
  value: string;
  format?: 'CODE128' | 'CODE39' | 'EAN13' | 'UPC';
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  font?: string;
  textAlign?: 'left' | 'center' | 'right';
  textPosition?: 'bottom' | 'top';
  textMargin?: number;
  background?: string;
  lineColor?: string;
  margin?: number;
  className?: string;
}

export const Barcode: React.FC<BarcodeProps> = ({
  value,
  format = 'CODE128',
  width = 2,
  height = 50,
  displayValue = true,
  fontSize = 12,
  font = 'monospace',
  textAlign = 'center',
  textPosition = 'bottom',
  textMargin = 2,
  background = '#ffffff',
  lineColor = '#000000',
  margin = 10,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    try {
      JsBarcode(svgRef.current, value, {
        format,
        width,
        height,
        displayValue,
        font,
        fontSize,
        textAlign,
        textPosition,
        textMargin,
        background,
        lineColor,
        margin,
      });
    } catch (err) {
      console.error('Failed to generate barcode for value:', value, err);
    }
  }, [
    value,
    format,
    width,
    height,
    displayValue,
    font,
    fontSize,
    textAlign,
    textPosition,
    textMargin,
    background,
    lineColor,
    margin,
  ]);

  return <svg ref={svgRef} className={className} />;
};
