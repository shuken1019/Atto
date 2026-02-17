# Frontend S3 Auto Deploy (GitHub Actions)

## 1) GitHub 리포지토리 설정
- `Settings` -> `Secrets and variables` -> `Actions`
- `Secrets` 추가:
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_REGION` = `ap-northeast-2`
  - `S3_BUCKET_NAME` = `atto-frontend-bucket`
  - `CLOUDFRONT_DISTRIBUTION_ID` (CloudFront 쓰는 경우만)
- `Variables` 추가:
  - `VITE_API_URL` = `http://3.37.232.202:3001`
  - `VITE_KAKAO_JS_KEY` (사용 중이면)

## 2) AWS IAM 권한
- 배포용 IAM 사용자(access key 발급)에 최소 아래 권한 필요
- 대상 버킷 이름에 맞게 리소스 수정

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::atto-frontend-bucket"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::atto-frontend-bucket/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation"
      ],
      "Resource": "*"
    }
  ]
}
```

## 3) 동작 방식
- `main` 브랜치에 push 시 자동 실행
- `npm ci` -> `npm run build` -> `dist`를 S3 sync
- `index.html`은 no-cache로 재업로드
- CloudFront ID가 있으면 캐시 무효화 실행

## 4) 팀원 사용법
- 팀원은 로컬에서 AWS CLI 세팅 불필요
- `main`에 머지하면 자동 배포
- 수동 실행은 `Actions` 탭에서 `Deploy Frontend To S3` -> `Run workflow`
