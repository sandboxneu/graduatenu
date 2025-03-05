import React from "react";

interface TriangleProps {
  boxSize?: string;
  onClick?: () => void;
}

export const UpTriangle: React.FC<TriangleProps> = ({
  boxSize = "10px",
  onClick,
}) => {
  return (
    <svg
      style={{ marginLeft: "12px" }}
      color="#C1CAD9"
      xmlns="http://www.w3.org/2000/svg"
      width={boxSize}
      height={boxSize}
      viewBox="0 0 10 7"
      fill="none"
      onClick={onClick}
    >
      <path
        d="M1.3964 6.5L9.11068 6.5C9.27311 6.5 9.4214 6.40829 9.49426 6.263C9.56626 6.11771 9.55083 5.94414 9.45354 5.81429L5.5964 0.671428C5.51583 0.563428 5.38854 0.5 5.25354 0.5C5.11854 0.5 4.99168 0.563428 4.91068 0.671428L1.05354 5.81429C0.955828 5.94414 0.940398 6.11771 1.01283 6.263C1.08568 6.40829 1.23397 6.5 1.3964 6.5Z"
        fill="#C1CAD9"
      />
    </svg>
  );
};

export const DownTriangle: React.FC<TriangleProps> = ({
  boxSize = "10px",
  onClick,
}) => {
  return (
    <svg
      style={{ marginLeft: "12px" }}
      color="#C1CAD9"
      transform="scale(1 -1)"
      xmlns="http://www.w3.org/2000/svg"
      width={boxSize}
      height={boxSize}
      viewBox="0 0 10 7"
      fill="none"
      onClick={onClick}
    >
      <path
        d="M1.3964 6.5L9.11068 6.5C9.27311 6.5 9.4214 6.40829 9.49426 6.263C9.56626 6.11771 9.55083 5.94414 9.45354 5.81429L5.5964 0.671428C5.51583 0.563428 5.38854 0.5 5.25354 0.5C5.11854 0.5 4.99168 0.563428 4.91068 0.671428L1.05354 5.81429C0.955828 5.94414 0.940398 6.11771 1.01283 6.263C1.08568 6.40829 1.23397 6.5 1.3964 6.5Z"
        fill="#C1CAD9"
      />
    </svg>
  );
};
