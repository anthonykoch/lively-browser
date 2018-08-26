<template>
  <div>
    <div class="Hero">

      <div class="Hero-container">
        <div style="text-align: center">
          <h2 class="Title">An interactive view into JavaScript execution</h2>
        </div>

        <figure>
          <div
            class="IntroVideo"
          >
            <video
              class="IntroVideo-video"
              src="~assets/videos/howitworks2.mp4"
              controls
              width="720"
            ></video>
          </div>
        </figure>

        <div class="About u-gutter">
          <div class="About-grid">
            <div class="md">
              <h2>How does it work?</h2>
              <p>
                The code is <a href="https://en.wikipedia.org/wiki/Instrumentation_(computer_programming)" target="_blank" rel="noreferrer noopener">instrumented</a> through a <a href="https://github.com/anthonykoch/scuffka-javascript" target="_blank" rel="noreferrer noopener">custom written instrumentor</a> that tracks the code execution. When you press play, the code is executed in a Web Worker. Since the code runs in a web worker, there is no access to the DOM. If you do manage to freeze the web worker, a prompt will come up asking if you'd like to
              </p>
              <p>
                The use of a web worker accomplishes a couple of things. First, it allows easily resetting the environment that the code runs in. Secondly, if the code is long running or an infinite loop incurs, the web worker <em>should</em> detect this and will prompt you to kill the script.
              </p>
              <p>
                The code tracking has been optimized so as to not hinder performance of the code being executed. However, there can still be some pretty drastic performance hits, so don't expect much from that end.
              </p>
              <p>
                The source code can be <a href="https://github.com/anthonykoch/vue-scuffka" rel="noreferrer noopener">found here for the editor code</a>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script>

export default {
  //
};

</script>

<style scoped lang="scss">

.Title {
  font-weight: 700;
  font-size: 38px;
  letter-spacing: 1px;
  line-height: 1.4;
  margin: auto;
  margin-bottom: 25px;
  max-width: 1000px;
  text-transform: uppercase;

}




.About {
  margin: 0 auto 100px;
  max-width: 600px;
}



.md {
  & > h2 {
    font-weight: bold;
    margin-bottom: 0.5rem;
  }

  & > p {
    font-size: 14px;
    margin-bottom: 2rem;
  }
}




.Hero {
  margin-top: 3rem;
  width: 100%;
}

.Hero-container {
  max-width: 1400px;
  margin-left: auto;
}

// .Hero-grid {
//   display: flex;
//   // margin-left: -20px;
//   // margin-right: -20px;
// }

// .Hero-column {
//   // padding-left: 20px;
//   // padding-right: 20px;

//   &:nth-child(1) {
//     width: 40%;
//   }

//   &:nth-child(2) {
//     flex: 1;
//   }
// }

.Hero-title {
  letter-spacing: 1px;
  letter-spacing: 0.25px;
  font-size: 40px;
  font-weight: 300;
  letter-spacing: 1px;
  // max-width: 960px;
  margin-left: 1rem;
  margin-right: 1rem;
  margin-top: 4rem;
  padding-bottom: 1.5rem;
  text-align: center;
}

.Hero-subtitle {
  color: #9bc2d8;
  font-size: 14px;
}

.Hero-description {
  line-height: 1.8;
  margin-bottom: 1rem;
  margin-left: auto;
  margin-right: auto;
  max-width: 600px;
  text-align: center;
}

.Hero-action {
  text-align: center;
  margin-bottom: 2rem;
}




.IntroVideo {
  display: block;
  margin-bottom: 60px;
  margin-left: auto;
  margin-right: auto;
  margin-top: 0px;
  max-width: 640px;
}

.IntroVideo-video {
  box-shadow: 0 8px 40px -1px rgba(0,0,0,0.5);
  border-radius: 4px;
  display: block;
  max-width: 100%;
}




@media only screen and (min-width: 40em) {
  .Title {
    font-size: 45px;
    line-height: 1.2;
    margin-bottom: 30px;
  }

  .IntroVideo {
    border-top: 1px solid #999;
    padding-top: 40px;
  }
}

</style>
