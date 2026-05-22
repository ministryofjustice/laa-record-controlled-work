#!/bin/bash

ENVIRONMENT=$1

# Load nginx image tag and ECR digest from the checked-in env file.
# Uses dirname "$0" so the path resolves relative to the script's location, not the caller's working directory.
# shellcheck source=docker-images.env
source "$(dirname "$0")/../docker-images.env"

deploy_branch() {
  BRANCH_RELEASE_NAME=$(./scripts/release-name.sh "$BRANCH_NAME")
# Set the deployment host, this will add the prefix of the branch name e.g el-257-deploy-with-circleci or just main
  RELEASE_HOST="$BRANCH_RELEASE_NAME-laa-record-controlled-work-uat.cloud-platform.service.justice.gov.uk"
# Set the ingress name, needs release name, namespace and -green suffix
  IDENTIFIER="$BRANCH_RELEASE_NAME-laa-record-controlled-work-$K8S_NAMESPACE-green"
  echo "Deploying commit: $GITHUB_SHA under release name: '$BRANCH_RELEASE_NAME'..."

  helm upgrade "$BRANCH_RELEASE_NAME" ./deploy/laa-record-controlled-work/. \
                --install --wait \
                --namespace="${K8S_NAMESPACE}" \
                --values ./deploy/laa-record-controlled-work/values/"$ENVIRONMENT".yaml \
                --set rcw.image.repository="$REGISTRY/$REPOSITORY" \
                --set rcw.image.tag="$IMAGE_TAG" \
                --set ccq.image.repository="$REGISTRY/$CCQ_ECR_REPOSITORY" \
                --set ccq.image.tag="$CCQ_IMAGE_TAG" \
                --set nginx.image.repository="$REGISTRY/$NGINX_ECR_REPOSITORY" \
                --set nginx.image.tag="${NGINX_IMAGE_TAG}@${NGINX_ECR_IMAGE_DIGEST_AMD64}" \
                --set ingress.annotations."external-dns\.alpha\.kubernetes\.io/set-identifier"="$IDENTIFIER" \
                --set ingress.hosts[0].host="$RELEASE_HOST" \
                --set rcw.env.ENTRA_REDIRECT_URI="https://$RELEASE_HOST/auth/code/callback" \
                --set rcw.env.ENTRA_POST_LOGOUT_REDIRECT_URI="https://$RELEASE_HOST/"
}

deploy_main() {  
  helm upgrade laa-record-controlled-work ./deploy/laa-record-controlled-work/. \
                          --install --wait --atomic \
                          --namespace="${K8S_NAMESPACE}" \
                          --values ./deploy/laa-record-controlled-work/values/"$ENVIRONMENT".yaml \
                          --set rcw.image.repository="$REGISTRY/$REPOSITORY" \
                          --set rcw.image.tag="$IMAGE_TAG" \
                          --set ccq.image.repository="$REGISTRY/$CCQ_ECR_REPOSITORY" \
                          --set ccq.image.tag="$CCQ_IMAGE_TAG" \
                          --set nginx.image.repository="$REGISTRY/$NGINX_ECR_REPOSITORY" \
                          --set nginx.image.tag="${NGINX_IMAGE_TAG}@${NGINX_ECR_IMAGE_DIGEST_AMD64}"
}

if [[ "$GITHUB_REF_NAME" == "main" ]]; then
  deploy_main
else
  if deploy_branch; then
    echo "Deploy succeeded"
  else
    echo "Deploy failed. Attempting rollback"
    if helm rollback "$BRANCH_RELEASE_NAME"; then
      echo "Rollback succeeded. Retrying deploy"
      deploy_branch
    else
      echo "Rollback failed. Consider manually running 'helm uninstall $BRANCH_RELEASE_NAME'"
      exit 1
    fi
  fi
fi
