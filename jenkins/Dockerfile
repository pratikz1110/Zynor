FROM jenkins/jenkins:lts

USER root

# Install dependencies + jq + AWS CLI v2
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl unzip jq ca-certificates \
  && curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "/tmp/awscliv2.zip" \
  && unzip /tmp/awscliv2.zip -d /tmp \
  && /tmp/aws/install \
  && rm -rf /var/lib/apt/lists/* /tmp/aws /tmp/awscliv2.zip

# Drop back to jenkins user
USER jenkins
