#!/bin/bash

ENVIRONMENT=$1
# Convert the branch name into a string that can be turned into a valid URL
  BRANCH_RELEASE_NAME=$(echo "$GITHUB_REF_NAME" | tr '[:upper:]' '[:lower:]' | sed 's:^\w*\/::' | tr -s ' _/[]().' '-' | cut -c1-18 | sed 's/-$//')

deploy_branch() {
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
                --set ingress.annotations."external-dns\.alpha\.kubernetes\.io/set-identifier"="$IDENTIFIER" \
                --set ingress.hosts[0].host="$RELEASE_HOST"
}

deploy_main() {  
  helm upgrade laa-record-controlled-work ./deploy/laa-record-controlled-work/. \
                          --install --wait --rollback-on-failure \
                          --namespace="${K8S_NAMESPACE}" \
                          --values ./deploy/laa-record-controlled-work/values/"$ENVIRONMENT".yaml \
                          --set rcw.image.repository="$REGISTRY/$REPOSITORY" \
                          --set rcw.image.tag="$IMAGE_TAG"
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
