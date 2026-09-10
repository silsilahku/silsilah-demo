export default function AddUserIcon({ size = 48 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 448 448"
      width={size}
      height={size}
      aria-label="Add user"
      role="img"
    >
      <circle cx="224" cy="224" r="224" fill="#258DD4" />

      <path
        d="M224 132L277 185V143L306 114L319 127V158L365 204L448 287V448H190L134 392V316L177 273C167 262 161 246 161 228C161 202 174 180 194 168Z"
        fill="#1475B7"
      />

      <circle cx="224" cy="183" r="53" fill="#fff" />

      <path
        d="M134 316C134 270 169 235 212 235H236C279 235 313 270 313 316Z"
        fill="#fff"
      />

      <path
        d="M277 99H319V132H347V159H319V185H291V159H277Z"
        fill="#fff"
      />
    </svg>
  );
}
